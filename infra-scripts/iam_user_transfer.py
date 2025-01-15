import boto3
import json


# Function to get policies attached to a user
def get_user_policies(iam_client, username):
    attached_policies = []
    paginator = iam_client.get_paginator("list_attached_user_policies")
    for response in paginator.paginate(UserName=username):
        for policy in response["AttachedPolicies"]:
            attached_policies.append(policy["PolicyArn"])
    return attached_policies


def get_inline_user_policies(iam_client, username):
    inline_policies = {}
    paginator = iam_client.get_paginator("list_user_policies")
    for response in paginator.paginate(UserName=username):
        for policy_name in response["PolicyNames"]:
            policy_document = iam_client.get_user_policy(
                UserName=username, PolicyName=policy_name
            )["PolicyDocument"]
            inline_policies[policy_name] = policy_document
    return inline_policies


# Function to get the policy document and metadata from a policy ARN
def get_policy_details(iam_client, policy_arn):
    policy_version = iam_client.get_policy(PolicyArn=policy_arn)["Policy"][
        "DefaultVersionId"
    ]
    policy_document = iam_client.get_policy_version(
        PolicyArn=policy_arn, VersionId=policy_version
    )["PolicyVersion"]["Document"]
    policy_name = policy_arn.split("/")[-1]
    return policy_name, policy_document


# Function to replace account IDs in the policy document
def replace_account_ids_in_policy(policy_document, source_account_id, dest_account_id):
    policy_document_str = json.dumps(policy_document)
    policy_document_str = policy_document_str.replace(
        source_account_id, dest_account_id
    )
    return json.loads(policy_document_str)


# Function to manage policy versions
def manage_policy_versions(iam_client, policy_arn):
    versions = iam_client.list_policy_versions(PolicyArn=policy_arn)["Versions"]

    # Check if there are more than 5 versions
    if len(versions) >= 5:
        # Find the oldest version that is not set as the default
        versions = sorted(versions, key=lambda x: x["CreateDate"])
        for version in versions:
            if not version["IsDefaultVersion"]:
                # Delete the oldest non-default version
                iam_client.delete_policy_version(
                    PolicyArn=policy_arn, VersionId=version["VersionId"]
                )
                print(
                    f"Deleted oldest policy version {version['VersionId']} for policy {policy_arn}"
                )
                break


# Function to create or update policies in the destination account
def create_or_update_policy(iam_client, policy_name, policy_document, dest_account_id):
    policy_arn = f"arn:aws:iam::{dest_account_id}:policy/{policy_name}"

    try:
        # Try to create the policy first
        iam_client.create_policy(
            PolicyName=policy_name, PolicyDocument=json.dumps(policy_document)
        )
        print(f"Created policy {policy_name} in destination account.")
    except iam_client.exceptions.EntityAlreadyExistsException:
        # If the policy already exists, update it
        try:
            manage_policy_versions(iam_client, policy_arn)
            iam_client.create_policy_version(
                PolicyArn=policy_arn,
                PolicyDocument=json.dumps(policy_document),
                SetAsDefault=True,
            )
            print(f"Updated policy {policy_name} in destination account.")
        except Exception as e:
            print(f"Failed to update policy {policy_name}: {e}")
    except Exception as e:
        print(f"Failed to create policy {policy_name}: {e}")


# Function to compress a JSON policy document by removing whitespace
def compress_policy_document(policy_document):
    return json.dumps(policy_document, separators=(",", ":"))


# Function to create or update inline policies in the destination account
def create_or_update_inline_policy(iam_client, username, policy_name, policy_document):
    try:
        iam_client.put_user_policy(
            UserName=username,
            PolicyName=policy_name,
            PolicyDocument=json.dumps(policy_document),
        )
        print(
            f"Created or updated inline policy {policy_name} for user {username} in destination account."
        )
    except Exception as e:
        print(
            f"Failed to create or update inline policy {policy_name} for user {username}: {e}"
        )


def main():
    source_account_profile = ""
    dest_account_profile = ""
    user_name = "terraform"

    # Replace these with actual account IDs
    global source_account_id
    source_account_id = ""
    dest_account_id = ""

    # Create boto3 session for source account
    source_session = boto3.Session(profile_name=source_account_profile)
    source_iam = source_session.client("iam")

    # Create boto3 session for destination account
    dest_session = boto3.Session(profile_name=dest_account_profile)
    dest_iam = dest_session.client("iam")

    # Get the policies attached to the user in the source account
    policies = get_user_policies(source_iam, user_name)
    # Get the inline policies for the user in the source account
    inline_policies = get_inline_user_policies(source_iam, user_name)

    if policies:
        # return
        for policy_arn in policies:
            policy_name, policy_document = get_policy_details(source_iam, policy_arn)

            # Replace source account ID with destination account ID in the policy document
            updated_policy_document = replace_account_ids_in_policy(
                policy_document, source_account_id, dest_account_id
            )

            # Create or update the policy in the destination account
            create_or_update_policy(
                dest_iam, policy_name, updated_policy_document, dest_account_id
            )

    # Process inline policies
    if inline_policies:
        for policy_name, policy_document in inline_policies.items():
            # Replace source account ID with destination account ID in the inline policy document
            updated_policy_document = replace_account_ids_in_policy(
                policy_document, source_account_id, dest_account_id
            )

            # Create or update the inline policy in the destination account
            create_or_update_inline_policy(
                dest_iam, user_name, policy_name, updated_policy_document
            )

    else:
        print(f"No policies found for user {user_name} in the source account.")


if __name__ == "__main__":
    main()

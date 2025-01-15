# GitLab Script to check if all the repos in specified repositories are synced from source to target branch.
# If not then creates new sync MRs.
import argparse
from typing import List, TypedDict

from gitlab import Gitlab

from .constants import (
    ANALYTICS_REPOSITORY_IDS_DICT,
    DEFAULT_ANALYTICS_REVERSE_SYNC_BRANCH_LIST,
    TEAM_MEMBER_NAME_TO_IDS_MAPPING,
)
from .helpers import logger, raise_mr
from .utils import unwrap_boolean


class CliArgsSchema(TypedDict):
    token: str
    raise_mrs: bool
    repo_ids: List[str]
    assignee_id: str
    assignee_name: str
    source_branch: str
    branch_list: List[str]


def unpack_cli_args() -> CliArgsSchema:
    cli_args_parser = argparse.ArgumentParser()

    # GitLab private token to communicate with gitlab APIs.
    cli_args_parser.add_argument("--token", default=None)
    # Raise MRs by default. Set to '0' to prevent raising MRs.
    cli_args_parser.add_argument("--raise-mrs", default="1")
    # Comma separated list of repository ids.
    cli_args_parser.add_argument("--repo-ids", default=None)
    # Assignee user id for MRs.
    cli_args_parser.add_argument("--assignee-id", default=None)
    # Assignee name for MRs.
    cli_args_parser.add_argument("--assignee-name", default=None)
    # Name of the branch from which reverse sync needs to start.
    cli_args_parser.add_argument("--source-branch", default=None)

    cli_args: CliArgsSchema = cli_args_parser.parse_args()

    # Required args validation.
    if not cli_args.token:
        raise Exception("Missing required parameter 'token'.")

    # Format args.
    if cli_args.repo_ids:
        try:
            cli_args.repo_ids = list(map(int, cli_args.repo_ids.split(",")))
        except TypeError:
            raise Exception("Repository ids should be integers only.")
    else:
        cli_args.repo_ids = ANALYTICS_REPOSITORY_IDS_DICT.values()

    cli_args.raise_mrs = unwrap_boolean(cli_args.raise_mrs)

    if (
        cli_args.assignee_id is None
        and (assignee_name := cli_args.assignee_name) is not None
    ):
        cli_args.assignee_id = TEAM_MEMBER_NAME_TO_IDS_MAPPING.get(
            assignee_name
        )

    return cli_args


def sync_target_with_source(
    *,
    repository_ids_list: List[int],
    source_branch: str = None,
    target_branch: str = None,
    assignee_user_id: int = None,
    do_raise_mrs=True,
) -> bool:
    if source_branch is None or target_branch is None:
        raise Exception("Specify source and target branch for reverse sync.")

    is_target_synced_with_source = False

    while not is_target_synced_with_source:
        logger.header(
            f"\n{source_branch.upper()} to {target_branch.upper()} sync status:"
        )

        all_repos_synced = True
        for repo_id in repository_ids_list:
            repo = gitlab_resource.projects.get(repo_id)

            if not raise_mr(
                repository=repo,
                source_branch_name=source_branch,
                target_branch_name=target_branch,
                do_raise_mrs=do_raise_mrs,
                assignee_user_id=assignee_user_id,
            ):
                all_repos_synced = False

        if all_repos_synced:
            is_target_synced_with_source = True
            logger.success(
                f"\n{source_branch.upper()} is in sync with {target_branch.upper()} for all repos.",
            )
            return True

        logger.fail(
            f"\n{source_branch.upper()} to {target_branch.upper()} is not synced for all repos. Do you want to check the merge status again? (y/n):",
            end=" ",
        )
        recheck_confirmation = input()
        if recheck_confirmation.lower() == "n":
            logger.fail("Reverse sync has been stopped.")
            exit()

    return False


if __name__ == "__main__":
    cli_args = unpack_cli_args()

    gitlab_resource = Gitlab(private_token=cli_args.token)

    # Prepare ordered branch list for reverse sync.
    branch_list = []
    if cli_args.source_branch is None:
        branch_list = DEFAULT_ANALYTICS_REVERSE_SYNC_BRANCH_LIST[:]
    else:
        branch_index = DEFAULT_ANALYTICS_REVERSE_SYNC_BRANCH_LIST.index(
            cli_args.source_branch
        )
        branch_list = DEFAULT_ANALYTICS_REVERSE_SYNC_BRANCH_LIST[branch_index:]

    idx = 0
    while idx + 1 < len(branch_list):
        current_source_branch = branch_list[idx]
        current_target_branch = branch_list[idx + 1]

        if sync_target_with_source(
            repository_ids_list=cli_args.repo_ids,
            source_branch=current_source_branch,
            target_branch=current_target_branch,
            assignee_user_id=cli_args.assignee_id,
            do_raise_mrs=cli_args.raise_mrs,
        ):
            idx += 1

    logger.success("Reverse merged all repos successfully.")

# Dev Scripts

This repository contains scripts for automating GitLab tasks and migrating databases.

## Getting Started

It is recommended to create a separate virtual environment for this project.

To install the required packages, run the following command in your virtual environment:

```bash
pip install -r requirements.txt
```

## Usage

### Reverse merge - Aereo Cloud Analytics

The reverse merge script is located in the [gitlab_automation_scripts](/gitlab_automation_scripts/) folder.

**Required parameters**:

- `token`: Your private GitLab token.\
  Ref: [Create personal access token (GitLab)](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html#create-a-personal-access-token)

**Optional parameters**:

- `repo-ids`: A comma-separated list of repository IDs. If not specified, the script will use the repository IDs from the ANALYTICS_REPOSITORY_IDS_DICT constant in [gitlab_automation_scripts/contants.py](/gitlab_automation_scripts/constants.py).
- `raise-mrs`: Set to 0 if you do not want to create merge requests and only want to check the status. The default value is 1, which means that the script will create merge requests if this parameter is not specified.
- `assignee-id`: Gitlab user ID of the developer who will be the assignee for raised MRs assignee.
- `assignee-name`: If `assignee-id` is also supplied then it will be used and `assignee-name` will be ignored. There is already an enum present which maps existing developers to their user IDs. Use first name of the developers to specify which developer should be the assignee for raised MRs.\
  Existing Users List:
  ```bash
  - shreyansh
  - priyanshu
  - vaibhav
  - rajtosh
  - rishita
  - amit
  - murali
  ```
- `source-branch`: Source branch name which will be used as the starting source for the reverse sync. By default, reverse merge script uses `DEFAULT_ANALYTICS_REVERSE_SYNC_BRANCH_LIST` list present in [constants.py](./gitlab_automation_scripts/constants.py) for reverse syncing and hence, the first element of this list will be used as the source branch. MRs are raised for the branches supplied in the list in same sequential order.

### Examples

- Running reverse merge script from base repo directory:

  ```
  # Setup virtual environment
  python -m venv virtual_env

  # Activate virtual environment
  source virtual_env/bin/activate

  # Install required dependencies
  pip install -r requirements.txt

  # Run the reverse merge script
  python -m gitlab_automation_scripts.reverse_sync --token YOUR_PRIVATE_TOKEN --raise-mrs 0 --repo-ids 234523,243524 --source-branch master
  ```

### Sync branches - Aereo Cloud Analytics
GitLab Script to check if all the repos in specified repositories are synced from source to target branch.
- If not then creates new sync MRs.

The reverse merge script is located in the [gitlab_automation_scripts](/gitlab_automation_scripts/) folder.

**Required parameters**:

- `token`: Your private GitLab token.\
  Ref: [Create personal access token (GitLab)](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html#create-a-personal-access-token)
- `source`: Source branch name.
- `target`: Target branch name.

**Optional parameters**:

- `repo-ids`: A comma-separated list of repository IDs. If not specified, the script will use the repository IDs from the ANALYTICS_REPOSITORY_IDS_DICT constant in /gitlab_automation_scripts/constants.py.
- `raise-mrs`: Set to 0 if you do not want to create merge requests and only want to check the status. The default value is 1, which means that the script will create merge requests if this parameter is not specified.
- `assignee-id`: GitLab user id of the user to which these MRs should be assigned. In-case no assignee id is supplied, the raised mrs won't be assigned to anyone.

### Examples

- Running sync branches script from base repo directory:

  ```
  # Setup virtual environment
  python -m venv virtual_env

  # Activate virtual environment
  source virtual_env/bin/activate

  # Install required dependencies
  pip install -r requirements.txt

  # Run the reverse merge script
  python -m gitlab_automation_scripts.sync_branch_analytics --token YOUR_PRIVATE_TOKEN --raise-mrs 0 --source uat --target master --repo-ids 234523,243524
  ```

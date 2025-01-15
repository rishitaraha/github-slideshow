# GitLab Script to check if all the repos in specified repositories are synced from source to target branch.
# If not then creates new sync MRs.
import argparse
from typing import List, TypedDict

from gitlab import Gitlab

from .constants import (
    ANALYTICS_REPOSITORY_IDS_DICT,
    TEAM_MEMBER_NAME_TO_IDS_MAPPING,
)
from .helpers import logger, raise_mr
from .utils import unwrap_boolean


class CliArgsSchema(TypedDict):
    token: str
    target: str
    source: str
    raise_mrs: bool
    repo_ids: List[str]
    assignee_id: str


def unpack_cli_args() -> CliArgsSchema:
    cli_args_parser = argparse.ArgumentParser()

    # GitLab private token to communicate with gitlab APIs.
    cli_args_parser.add_argument("--token", default=None)
    # Target branch for sync MRs.
    cli_args_parser.add_argument("--target")
    # Source branch for sync MRs.
    cli_args_parser.add_argument("--source")
    # Raise MRs by default. Set to '0' to prevent raising MRs.
    cli_args_parser.add_argument("--raise-mrs", default="1")
    # Comma separated list of repository ids.
    cli_args_parser.add_argument("--repo-ids", default=None)
    # Assignee user id.
    cli_args_parser.add_argument("--assignee-id", default=None)
    # Assignee name.
    cli_args_parser.add_argument("--assignee-name", default=None)

    cli_args = cli_args_parser.parse_args()

    # Required args validation.
    if not cli_args.token:
        raise Exception("Missing required parameter 'token'.")

    if not (cli_args.source and cli_args.target):
        raise Exception("Source and Target branch names are required.")

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


if __name__ == "__main__":
    cli_args = unpack_cli_args()

    gitlab_resource = Gitlab(private_token=cli_args.token)

    all_repos_synced = True
    for repo_id in cli_args.repo_ids:
        repo = gitlab_resource.projects.get(repo_id)

        if not raise_mr(
            repo,
            cli_args.source,
            cli_args.target,
            cli_args.raise_mrs,
            cli_args.assignee_id,
        ):
            all_repos_synced = False

    if all_repos_synced:
        logger.success(
            f"\n{cli_args.source.upper()} is in sync with {cli_args.target.upper()} for all repos.",
        )
    else:
        logger.fail(
            f"\n{cli_args.source.upper()} to {cli_args.target.upper()} is not synced for all repos.",
        )

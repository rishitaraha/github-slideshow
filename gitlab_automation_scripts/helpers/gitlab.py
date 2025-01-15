from gitlab.v4.objects import Project

from .logger import logger


def search_open_mrs(repo, source_branch, target_branch) -> str | None:
    opened_mrs = repo.mergerequests.list(
        state="opened",
        source_branch=source_branch,
        target_branch=target_branch,
    )
    return opened_mrs


def open_sync_mr(
    repo,
    source_branch: str,
    target_branch: str,
    title: str,
    assignee_user_id: int = None,
) -> str:
    print("Creating sync MR...")
    opened_mr = repo.mergerequests.create(
        data={
            "source_branch": source_branch,
            "target_branch": target_branch,
            "title": title,
            "assignee_id": assignee_user_id,
        }
    )

    return opened_mr.web_url


def raise_mr(
    repository: Project,
    source_branch_name: str,
    target_branch_name: str,
    do_raise_mrs: bool = True,
    assignee_user_id: int = None,
) -> bool:
    logger.bold(f"\n{repository.name}")

    source_to_target_diff = repository.repository_compare(
        from_=target_branch_name, to=source_branch_name
    )
    if len(source_to_target_diff.get("diffs", [])):
        logger.fail(
            f"{source_branch_name.upper()} -✘-> {target_branch_name.upper()}",
        )

        # Check for already open MRs.
        opened_mr_url = None
        if opened_mrs := search_open_mrs(
            repository, source_branch_name, target_branch_name
        ):
            opened_mr_url = opened_mrs[0].web_url

        # Raise MR, if not an open MR is already present and if raise mrs flag is true.
        if not opened_mr_url and do_raise_mrs:
            opened_mr_url = open_sync_mr(
                repository,
                source_branch_name,
                target_branch_name,
                title=f"{source_branch_name.upper()} to {target_branch_name.upper()} sync",
                assignee_user_id=assignee_user_id,
            )

        logger.info("MR Web URL:", end=" ")
        logger.info_underlined(f"{opened_mr_url}")
        return False

    logger.success(
        f"{source_branch_name.upper()} -✔-> {target_branch_name.upper()}",
    )
    return True

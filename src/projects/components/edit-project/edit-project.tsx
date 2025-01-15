import {
  AccordionCheckBoxStatus,
  Button,
  ButtonVariant,
  Input,
  InputGroup,
  SideCard,
  Spinner,
  TabSwitcher,
  getCheckboxStatus,
} from '@aus-platform/design-system';
import { isEmpty, isUndefined } from 'lodash';
import React, { useEffect, useState } from 'react';
import {
  handleResponseMessage,
  useProject,
  useUpdateProjectRequest,
  useUserGroupList,
} from '../../../shared/api';
import { useInputFields } from '../../../shared/hooks';
import { projectTabs } from '../constants';
import { ProjectACL, ProjectUserGroupList } from '../project-acl';
import { EditProjectInput, EditProjectProps } from './types';
import { ProjectPermission } from 'src/projects/enums';

const editProjectInputInitialState: EditProjectInput = {
  name: '',
};

export const EditProject: React.FC<EditProjectProps> = ({
  show,
  projectId,
  onCloseSideCard,
  refetchProjects,
}) => {
  // States.
  const [activeTabKey, setActiveTabKey] = useState(projectTabs.Basic);
  const [userGroups, setUserGroups] = useState<ProjectUserGroupList>({});
  const [selectedUserGroupsCount, setSelectedUserGroupsCount] = useState(0);

  // Hooks.
  const {
    values,
    names,
    errors,
    setValues,
    onChange,
    onBlur,
    onFocus,
    resetAll,
    inputHasError,
    inputIsDirty,
  } = useInputFields<EditProjectInput>(editProjectInputInitialState);

  const {
    data: projectResponse,
    isSuccess: projectResponseIsSuccess,
    isLoading: projectResponseIsLoading,
    refetch: refetchProject,
  } = useProject(projectId);

  const {
    mutate: sendUpdateProjectRequest,
    data: addProjectResponse,
    isError: isErrorAddProject,
    isPending: isLoadingAddProject,
    isSuccess: isSuccessAddProject,
    error: addProjectError,
  } = useUpdateProjectRequest();

  const {
    data: userGroupListResponse,
    isLoading: userGroupListIsLoading,
    isSuccess: userGroupListIsSuccess,
  } = useUserGroupList(show, {});

  // useEffects.
  useEffect(() => {
    projectId && refetchProject();
  }, [projectId]);

  useEffect(() => {
    if (projectResponse && projectResponseIsSuccess) {
      setValues({
        name: projectResponse.data.name,
      });
    }
    return () => setValues(editProjectInputInitialState);
  }, [projectResponse, projectResponseIsSuccess]);

  useEffect(() => {
    if (isSuccessAddProject && addProjectResponse) {
      onCloseSideCard();
      setValues(editProjectInputInitialState);
      refetchProjects();
    }
    handleResponseMessage(
      isSuccessAddProject,
      isErrorAddProject,
      addProjectResponse,
      addProjectError,
    );
  }, [isSuccessAddProject, isErrorAddProject]);

  useEffect(() => {
    if (
      userGroupListIsSuccess &&
      userGroupListResponse &&
      projectResponse &&
      projectResponseIsSuccess
    ) {
      setValues({
        name: projectResponse.data.name,
      });

      const projectPermissions = projectResponse?.data.permissions;
      let selectedUserGroupsCount = 0;
      const groups = userGroupListResponse.data.userGroups.reduce(
        (previousGroups, currentGroup) => {
          if (!isUndefined(projectPermissions[currentGroup.id])) {
            currentGroup[ProjectPermission.canView] =
              projectPermissions[currentGroup.id].canView;
            currentGroup[ProjectPermission.canManageSites] =
              projectPermissions[currentGroup.id].canManageSites;
            if (
              getCheckboxStatus([
                currentGroup[ProjectPermission.canView],
                currentGroup[ProjectPermission.canManageSites],
              ]) !== AccordionCheckBoxStatus.Unchecked
            ) {
              selectedUserGroupsCount++;
            }
          }

          if (isUndefined(currentGroup[ProjectPermission.canView])) {
            currentGroup[ProjectPermission.canView] = false;
          }

          if (isUndefined(currentGroup[ProjectPermission.canManageSites])) {
            currentGroup[ProjectPermission.canManageSites] = false;
          }

          return {
            ...previousGroups,
            [currentGroup.id]: {
              name: currentGroup.name,
              show: true,
              canView: currentGroup[ProjectPermission.canView],
              canManageSites: currentGroup[ProjectPermission.canManageSites],
              checkboxStatus: getCheckboxStatus([
                currentGroup[ProjectPermission.canView],
                currentGroup[ProjectPermission.canManageSites],
              ]),
            },
          };
        },
        {},
      );
      setUserGroups(groups);
      setSelectedUserGroupsCount(selectedUserGroupsCount);

      return () => setValues(editProjectInputInitialState);
    }
  }, [
    userGroupListIsSuccess,
    userGroupListResponse,
    projectResponse,
    projectResponseIsSuccess,
  ]);

  // Handlers.
  const onSubmit = (e) => {
    e.preventDefault();
    if (!inputHasError() && inputIsDirty()) {
      sendUpdateProjectRequest({ ...values, id: projectResponse?.data.id });
    }
  };

  const onProjectCloseSideCard = () => {
    setActiveTabKey(projectTabs.Basic);
    resetAll();
    onCloseSideCard();
  };

  // Renders.
  const renderProjectInput = () => {
    return (
      <>
        {projectResponseIsLoading ? (
          <Spinner />
        ) : (
          <InputGroup>
            {/** Name */}
            <Input.Label>Project Name</Input.Label>
            <Input.Text
              placeholder="Name"
              value={values.name}
              name={names.name}
              error={errors.name}
              isInvalid={!!errors.name}
              onKeyPress={(event) => event.key === 'Enter' && onSubmit(event)}
              {...{ onChange, onBlur, onFocus }}
            />
          </InputGroup>
        )}
      </>
    );
  };

  const renderSideCardFooter = () => (
    <>
      <Button
        variant={ButtonVariant.Secondary}
        onClick={onProjectCloseSideCard}
      >
        Cancel
      </Button>
      {activeTabKey === projectTabs.Basic ? (
        <Button
          type="submit"
          onClick={onSubmit}
          isLoading={isLoadingAddProject}
          disabled={
            values.name === projectResponse?.data.name || isEmpty(values.name)
          }
          data-testid="update-project-btn-submit"
        >
          Update Project
        </Button>
      ) : (
        <Button onClick={onProjectCloseSideCard}>Done</Button>
      )}
    </>
  );

  return (
    <SideCard
      show={show}
      title={`Edit Project - ${projectResponse?.data.name}`}
      onClose={onProjectCloseSideCard}
      showCloseButton={true}
      className="sidecard-with-tabs"
      footerClassName="justify-content-end"
      footer={renderSideCardFooter()}
      data-testid="edit-project-side-card"
    >
      <TabSwitcher
        tabComponentList={[
          {
            label: projectTabs.Basic,
            children: renderProjectInput(),
            key: projectTabs.Basic,
          },
          {
            label: projectTabs.AccessControl,
            children: (
              <ProjectACL
                projectId={projectId}
                userGroups={userGroups}
                isLoading={userGroupListIsLoading}
                totalUserGroups={userGroupListResponse?.data.total || 0}
                selectedUserGroupsCount={selectedUserGroupsCount}
              />
            ),
            key: projectTabs.AccessControl,
          },
        ]}
        activeKey={activeTabKey}
        onTabSwitch={(tabKey) => setActiveTabKey(tabKey)}
      />
    </SideCard>
  );
};

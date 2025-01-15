import {
  AccordionCheckBoxStatus,
  Button,
  ButtonVariant,
  Input,
  InputGroup,
  SideCard,
  SideCardLocation,
  TabSwitcher,
} from '@aus-platform/design-system';
import { isEmpty } from 'lodash';
import React, { useEffect, useState } from 'react';
import { projectTabs } from '..';
import {
  handleResponseMessage,
  useAddProjectRequest,
  useUserGroupList,
} from '../../../shared/api';
import { useInputFields } from '../../../shared/hooks';
import { ProjectACL, ProjectUserGroupList } from '../project-acl';
import { AddProjectInput, AddProjectSideCard } from '.';

const addProjectInputInitialState: AddProjectInput = {
  name: '',
};

export const AddProject: React.FC<AddProjectSideCard> = ({
  show,
  onCloseSideCard,
  refetchProjects,
}) => {
  // States.
  const [activeTabKey, setActiveTabKey] = useState(projectTabs.Basic);
  const [userGroups, setUserGroups] = useState<ProjectUserGroupList>({});

  // Hooks.
  const {
    values,
    names,
    errors,
    setValues,
    onChange,
    onBlur,
    onFocus,
    inputHasError,
    inputIsDirty,
    resetAll,
  } = useInputFields<AddProjectInput>(addProjectInputInitialState);

  const {
    mutate: sendAddProjectRequest,
    data: addProjectResponse,
    isError: isErrorAddProject,
    isPending: isLoadingAddProject,
    isSuccess: isSuccessAddProject,
    error: addProjectError,
  } = useAddProjectRequest();

  const {
    data: userGroupListResponse,
    isLoading: userGroupListIsLoading,
    isSuccess: userGroupListIsSuccess,
  } = useUserGroupList(show, {});

  // useEffects.
  useEffect(() => {
    if (isSuccessAddProject && addProjectResponse) {
      setValues(addProjectInputInitialState);
      refetchProjects();
      setActiveTabKey(projectTabs.AccessControl);
    }
    handleResponseMessage(
      isSuccessAddProject,
      isErrorAddProject,
      addProjectResponse,
      addProjectError,
    );
  }, [isSuccessAddProject, isErrorAddProject]);

  useEffect(() => {
    if (userGroupListIsSuccess && userGroupListResponse) {
      const groups = userGroupListResponse.data.userGroups.reduce(
        (previousGroups, currentGroup) => {
          return {
            ...previousGroups,
            [currentGroup['id']]: {
              name: currentGroup.name,
              show: true,
              canView: false,
              canManageSites: false,
              checkboxStatus: AccordionCheckBoxStatus.Unchecked,
            },
          };
        },
        {},
      );
      setUserGroups(groups);
    }
  }, [userGroupListIsSuccess, userGroupListResponse]);

  // Handlers.
  const onProjectCloseSideCard = () => {
    setActiveTabKey(projectTabs.Basic);
    onCloseSideCard();
    resetAll();
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (
      activeTabKey === projectTabs.Basic &&
      !inputHasError() &&
      inputIsDirty()
    ) {
      sendAddProjectRequest(values);
    }
  };

  // Renders.
  const renderProjectInput = () => {
    return (
      <InputGroup>
        {/** Name */}
        <Input.Label>Project Name</Input.Label>
        <Input.Text
          placeholder="Name"
          value={values.name}
          name={names.name}
          error={errors.name}
          isInvalid={!!errors.name}
          onKeyPress={(event) => (event.key === 'Enter' ? onSubmit(event) : {})}
          {...{ onChange, onBlur, onFocus }}
        />
      </InputGroup>
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
          isLoading={isLoadingAddProject}
          disabled={isEmpty(values.name)}
          onClick={onSubmit}
          data-testid="add-project-btn-submit"
        >
          Add Project
        </Button>
      ) : (
        <Button
          onClick={onProjectCloseSideCard}
          data-testid="add-project-btn-done"
        >
          Done
        </Button>
      )}
    </>
  );

  return (
    <SideCard
      title="Add Project"
      className="sidecard-with-tabs"
      footerClassName="justify-content-end"
      showCloseButton={true}
      placement={SideCardLocation.End}
      show={show}
      onClose={onProjectCloseSideCard}
      footer={renderSideCardFooter()}
      data-testid="add-project-side-card"
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
                userGroups={userGroups}
                projectId={addProjectResponse?.data.id}
                isLoading={userGroupListIsLoading}
                totalUserGroups={userGroupListResponse?.data.total || 0}
              />
            ),
            key: projectTabs.AccessControl,
          },
        ]}
        activeKey={activeTabKey}
        className="disable-tab-switching"
      />
    </SideCard>
  );
};

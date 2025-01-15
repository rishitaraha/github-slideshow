import {
  Button,
  IconIdentifier,
  Input,
  Spinner,
} from '@aus-platform/design-system';
import { isEmpty } from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProjectList } from '../shared/api/projects';
import { ProjectListItem } from '../shared/api/projects/types';
import { GlobalContext, HeaderTitleContext } from '../shared/context';
import { isOrgAdmin } from '../shared/helpers';
import { useInputFields } from '../shared/hooks';
import { ComponentRoute } from '../shared/types';
import { AddProject, EditProject, ProjectCard } from './components';

export const Projects: React.FC & ComponentRoute = () => {
  // States.
  const [projects, setProjects] = useState<ProjectListItem[]>();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddProject, setShowAddProject] = useState(false);
  const [editProject, setEditProject] = useState({
    show: false,
    projectId: '',
  });

  // Hooks.
  const { values, names, onChange, onBlur, onFocus, setValues } =
    useInputFields({
      searchInput: '',
    });

  const [routeQueries] = useSearchParams();
  const navigate = useNavigate();

  const {
    data: projectsResponse,
    isSuccess: isSuccessProjectList,
    isLoading: isLoadingProjectList,
    isRefetching: isRefetchingProjectList,
    refetch: refetchProjectList,
  } = useProjectList({
    payload: {
      searchQuery,
    },
  });

  // Contexts.
  const { setHeaderTitle } = useContext(HeaderTitleContext);
  const { loggedUser } = useContext(GlobalContext);

  // useEffects.
  useEffect(() => {
    setHeaderTitle('Projects');
  }, []);

  useEffect(() => {
    if (isSuccessProjectList && projectsResponse) {
      setProjects(projectsResponse.data.projects);
    }
  }, [projectsResponse]);

  useEffect(() => {
    const searchQ = routeQueries.get('search');
    if (searchQ) {
      setSearchQuery(searchQ);
      setValues({ searchInput: searchQ });
    }
  }, []);

  useEffect(() => {
    refetchProjectList();
    searchQuery
      ? navigate({ search: '?search=' + searchQuery }, { replace: true })
      : navigate({ search: '' }, { replace: true });
  }, [searchQuery]);

  // Handlers.
  const onSearchSubmit = (event) => {
    event.preventDefault();
    setSearchQuery(values.searchInput);
  };

  const openAddProjectSideCard = () => setShowAddProject(true);
  const closeAddProjectSideCard = () => setShowAddProject(false);
  const openEditProjectSideCard = (projectId: string) =>
    setEditProject({
      show: true,
      projectId: projectId,
    });
  const closeEditProjectSideCard = () =>
    setEditProject({
      show: false,
      projectId: '',
    });

  const listSites = (projectId) => navigate('/sites?projectId=' + projectId);

  return (
    <>
      <div className="screen projects">
        {/* Project Options. */}
        {(!isEmpty(projects) || searchQuery) && (
          <div className="projects__options">
            <Input.Search
              className="projects__options__search"
              name={names.searchInput}
              value={values.searchInput}
              onSubmit={onSearchSubmit}
              iconSize={20}
              {...{ onChange, onBlur, onFocus }}
            />
            {isOrgAdmin(loggedUser) && (
              <Button
                rightIconIdentifier={IconIdentifier.Plus}
                onClick={openAddProjectSideCard}
                className="projects__options__add-btn"
                data-testid="add-project-btn"
              >
                Add Project
              </Button>
            )}
          </div>
        )}

        {/* Projects list. */}
        {!isEmpty(projects) && (
          <div className="projects__container" data-testid="projects-list">
            {projects?.map((project, index) => (
              <ProjectCard
                name={project.name}
                date={project?.date}
                sites={project?.totalSites}
                index={index}
                onEdit={() => openEditProjectSideCard(project.id)}
                onClick={() => listSites(project.id)}
                key={project.id}
              />
            ))}
          </div>
        )}

        {/* No project present. */}
        {isEmpty(projects) &&
          (isLoadingProjectList || isRefetchingProjectList ? (
            <Spinner />
          ) : searchQuery ? (
            <div className="projects-empty">
              <div className="projects-empty__text">
                No Projects found matching search criteria
              </div>
            </div>
          ) : (
            <div className="projects-empty">
              <div className="projects-empty__text">No Projects present</div>

              {/* Show add user button if user is org admin. */}
              {isOrgAdmin(loggedUser) && (
                <Button
                  rightIconIdentifier={IconIdentifier.Plus}
                  onClick={openAddProjectSideCard}
                  data-testid="add-project-btn"
                >
                  Add Project
                </Button>
              )}
            </div>
          ))}
      </div>

      {/* Add and Edit Projects. */}
      {isOrgAdmin(loggedUser) && (
        <>
          <AddProject
            show={showAddProject}
            onCloseSideCard={closeAddProjectSideCard}
            refetchProjects={refetchProjectList}
          />
          <EditProject
            show={editProject.show}
            onCloseSideCard={closeEditProjectSideCard}
            refetchProjects={refetchProjectList}
            projectId={editProject.projectId}
          />
        </>
      )}
    </>
  );
};

Projects.route = '/projects/';

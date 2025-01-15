import {
  Button,
  ButtonVariant,
  IconIdentifier,
} from '@aus-platform/design-system';
import React, { useContext } from 'react';
import { Image } from '../../../assets';
import { GlobalContext } from '../../../shared/context';
import { isOrgAdmin } from '../../../shared/helpers';
import { ProjectCardProps } from './types';

export const ProjectCard: React.FC<ProjectCardProps> = ({
  name,
  date,
  sites,
  onEdit,
  onClick,
  index,
}) => {
  // Contexts.
  const { loggedUser } = useContext(GlobalContext);

  return (
    <div
      className="project-card"
      onClick={onClick}
      data-testid={`update-project-${index + 1}-card`}
    >
      <div className="project-card__thumbnail">
        {isOrgAdmin(loggedUser) && (
          <Button
            leftIconIdentifier={IconIdentifier.PencilFill}
            variant={ButtonVariant.Link}
            className="project-card__thumbnail__edit-btn"
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
            data-testid={`update-project-${index + 1}-btn`}
          />
        )}
        <span className="project-card__thumbnail__badge">{sites} sites</span>
        <div className="project-card__thumbnail__images">
          <img src={Image.ProjectImg1} />
          <img src={Image.ProjectImg2} />
          <img src={Image.ProjectImg3} />
          <img src={Image.ProjectImg4} />
        </div>
      </div>
      <div className="project-card__info">
        <p className="project-card__info__name">{name}</p>
        <small className="project-card__info__date">{date}</small>
      </div>
    </div>
  );
};

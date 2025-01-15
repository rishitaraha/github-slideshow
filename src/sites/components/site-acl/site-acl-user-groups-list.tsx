import {
  Accordion,
  AccordionCheckBoxStatus,
  Input,
  InputGroup,
  Placement,
  SelectOption,
  SwitchCard,
  Tooltip,
} from '@aus-platform/design-system';
import { isNil } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { useOnFirstMount } from '../../../shared/hooks';
import { AccessType } from '../enums';
import { accessTypeOptions } from './constants';
import {
  CheckboxStatusParams,
  SiteACLUserGroupListProps,
  SiteUserGroup,
} from './types';

const initalSelectedAccessTypeOption = accessTypeOptions[0];

export const SiteACLUserGroupsList: React.FC<SiteACLUserGroupListProps> = ({
  uniqueKey,
  groupId,
  group,
  setCheckboxStatus,
}) => {
  // useMemo.
  const getInitialAccessTypeOption: SelectOption<AccessType> = useMemo(() => {
    if (!isNil(group.accessType)) {
      if (group.accessType === AccessType.Basic) {
        return accessTypeOptions[0];
      }
      return accessTypeOptions[1];
    }

    return initalSelectedAccessTypeOption;
  }, []);

  // useStates.
  const [selectedAccessTypeOption, setSelectedAccessTypeOption] = useState<
    SelectOption<AccessType>
  >(getInitialAccessTypeOption);

  // useMemo.
  const defaultCheckboxParams: CheckboxStatusParams = useMemo(() => {
    return {
      groupId,
      newStatus: AccordionCheckBoxStatus.Unchecked,
      accessType: selectedAccessTypeOption.value,
      canView: false,
      canManageIterationsAndLayers: false,
    };
  }, [selectedAccessTypeOption]);

  // Hooks.
  const isFirstRender = useOnFirstMount();

  // useEffects.
  useEffect(() => {
    if (!isFirstRender) {
      setCheckboxStatus({
        ...defaultCheckboxParams,
        canView: group.canView,
        canManageIterationsAndLayers: group.canManageIterationsAndLayers,
      });
    }
  }, [selectedAccessTypeOption]);

  // Handlers.
  const onToggle = (groupId: string, userGroup: SiteUserGroup) => {
    const { canView, canManageIterationsAndLayers } = userGroup;
    let newCheckboxStatus: CheckboxStatusParams;

    if (!canView && !canManageIterationsAndLayers) {
      newCheckboxStatus = {
        groupId,
        newStatus: AccordionCheckBoxStatus.Unchecked,
        accessType: selectedAccessTypeOption.value,
        canView,
        canManageIterationsAndLayers,
      };
    } else if (
      (!canView && canManageIterationsAndLayers) ||
      (canView && !canManageIterationsAndLayers)
    ) {
      newCheckboxStatus = {
        groupId,
        newStatus: AccordionCheckBoxStatus.Indeterminate,
        accessType: selectedAccessTypeOption.value,
        canView,
        canManageIterationsAndLayers,
      };
    } else {
      newCheckboxStatus = {
        groupId,
        newStatus: AccordionCheckBoxStatus.Checked,
        accessType: selectedAccessTypeOption.value,
        canView,
        canManageIterationsAndLayers,
      };
    }
    setCheckboxStatus(newCheckboxStatus);
  };

  const onCheckBoxClick = (userGroup: SiteUserGroup) => {
    // Passing it default some values.
    let checkboxStatusParams: CheckboxStatusParams = defaultCheckboxParams;

    // Checking if the current status is Checked or Indeterminate.
    if (userGroup.checkboxStatus === AccordionCheckBoxStatus.Unchecked) {
      checkboxStatusParams = {
        ...defaultCheckboxParams,
        newStatus: AccordionCheckBoxStatus.Checked,
        canView: true,
        canManageIterationsAndLayers: true,
      };
    }
    setCheckboxStatus(checkboxStatusParams);
  };

  const selectHandler = (option: SelectOption<AccessType>) => {
    setSelectedAccessTypeOption(option);
  };

  const getTitle = (canView: boolean, accessType: AccessType) => {
    if (accessType === AccessType.Advance) {
      if (canView) {
        return {
          label: 'View',
          tooltip: 'View Site, Iterations & Layers based on Access Tags',
        };
      }
      return {
        label: 'Create and Manage',
        tooltip:
          'Create and Manage Iterations & Layers and assign Access Tags to Layers',
      };
    } else {
      if (canView) {
        return {
          label: 'View',
          tooltip: 'View Site, Iterations & Layers',
        };
      }
      return {
        label: 'Create and Manage',
        tooltip: 'Create, View & Edit Iterations & Layers',
      };
    }
  };

  //Render.
  const accessTypeInfo = () => {
    return (
      <div>
        <p>
          <strong>Basic All Access:</strong> Users get view and manage access
          based on toggle.
        </p>
        <p>
          <strong>Advanced Tag Based Access:</strong> Users get layer view
          access based on access tags; manage access with toggle.
        </p>
      </div>
    );
  };

  return (
    <Accordion.ItemWithCheckBox
      title={group.name}
      checkBoxStatus={group.checkboxStatus}
      eventKey={uniqueKey.toString()}
      onCheckBoxClick={() => onCheckBoxClick(group)}
    >
      <InputGroup>
        <Input.Label
          info={accessTypeInfo()}
          infoPlacement={Placement.Top}
          tooltipClassname="site-acl__user-group-list__tooltip"
        >
          Access Type
        </Input.Label>
        <Input.Select
          options={accessTypeOptions}
          value={selectedAccessTypeOption}
          onChange={selectHandler}
        />
      </InputGroup>

      <>
        <SwitchCard
          title={
            <Tooltip
              hoverText={getTitle(true, selectedAccessTypeOption.value).tooltip}
            >
              {getTitle(true, selectedAccessTypeOption.value).label}
            </Tooltip>
          }
          checked={group.canView}
          onClick={() =>
            onToggle(groupId, {
              ...group,
              canView: !group.canView,
              canManageIterationsAndLayers: !group.canView
                ? group.canManageIterationsAndLayers
                : !group.canView,
            })
          }
          dataTestId="view-site-checkbox-id"
          onChange={() => {}}
        />
        <SwitchCard
          title={
            <Tooltip
              hoverText={
                getTitle(false, selectedAccessTypeOption.value).tooltip
              }
            >
              {getTitle(false, selectedAccessTypeOption.value).label}
            </Tooltip>
          }
          checked={group.canManageIterationsAndLayers}
          onClick={() =>
            onToggle(groupId, {
              ...group,
              canView: group.canManageIterationsAndLayers
                ? group.canView
                : !group.canManageIterationsAndLayers,
              canManageIterationsAndLayers: !group.canManageIterationsAndLayers,
            })
          }
          dataTestId="create-manage-site-checkbox-id"
          onChange={() => {}}
        />
      </>
    </Accordion.ItemWithCheckBox>
  );
};

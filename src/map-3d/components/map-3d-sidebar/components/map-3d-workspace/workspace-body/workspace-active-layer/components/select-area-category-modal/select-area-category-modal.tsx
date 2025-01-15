import {
  Button,
  ButtonVariant,
  Input,
  SelectOption,
} from '@aus-platform/design-system';
import React, { useMemo, useState } from 'react';
import { Modal, ModalProps } from 'react-bootstrap';
import { areaCategoryOptions } from './constants';
import { AreaCategory } from 'shared/api';

type SelectAreaCategoryModalProps = ModalProps & {
  layerAreaCategory: AreaCategory | null;
  isLoading: boolean;
  onClose: () => void;
  onSave: (selectedCategory: AreaCategory) => void;
};

export const SelectAreaCategoryModal: React.FC<
  SelectAreaCategoryModalProps
> = ({ layerAreaCategory, isLoading, onClose, onSave }) => {
  // UseMemo.
  const initialSelectedAreaCategory = useMemo(
    () =>
      areaCategoryOptions.find(
        (areaCategoryOption) => areaCategoryOption.value === layerAreaCategory,
      ) || areaCategoryOptions[0],
    [layerAreaCategory],
  );

  // States.
  const [selectedAreaCategory, setSelectedAreaCategory] = useState<
    SelectOption<AreaCategory>
  >(initialSelectedAreaCategory);

  // Handlers.
  const onAreaCategorySelect = (selectedValue: SelectOption<AreaCategory>) => {
    setSelectedAreaCategory(selectedValue);
  };

  return (
    <Modal
      show={true}
      onHide={onClose}
      dialogClassName="select-area-category-modal"
      backdrop="static"
      centered
    >
      <Modal.Header>Select Area Category</Modal.Header>
      <Modal.Body>
        <Input.Select
          options={areaCategoryOptions}
          value={selectedAreaCategory}
          onChange={onAreaCategorySelect}
        />
      </Modal.Body>

      <Modal.Footer>
        <Button variant={ButtonVariant.Secondary} onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          onClick={() => {
            onSave(selectedAreaCategory.value);
          }}
          isLoading={isLoading}
        >
          Save
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

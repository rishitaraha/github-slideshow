import React, { useEffect, useState } from 'react';
import { AiFillEdit, AiFillDelete, AiOutlineLock, AiOutlineExport } from 'react-icons/ai';

import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  Button,
  TextField,
  FormGroup
} from '@mui/material';
import { GrHide, GrAlert } from 'react-icons/gr';

const EditButton = ({ handleClick }) => <AiFillEdit onClick={handleClick} />;

const DeleteButton = ({ handleClick }) => <AiFillDelete onClick={handleClick} />;

const DisableButton = ({ handleClick }) => <AiOutlineLock onClick={handleClick} />;

const ExportWKTButton = ({ handleClick }) => <AiOutlineExport onClick={handleClick} />;

const ToggleVisibility = ({ handleClick }) => <GrHide onClick={handleClick} />;

const ToggleFixLabelSize = ({ handleClick }) => <GrAlert onClick={handleClick} />;

const DeleteDialog = ({ isOpen, onDialogClose, onConfirmDelete, featureData }) => (
  <Dialog open={isOpen} onClose={onDialogClose}>
    <DialogTitle>Delete feature</DialogTitle>
    <DialogContent>
      <DialogContentText>Are you sure you want to delete this feature?</DialogContentText>
      <FormGroup>
        <Button onClick={() => onConfirmDelete(featureData)}>Yes</Button>
        <Button onClick={onDialogClose}>No</Button>
      </FormGroup>
    </DialogContent>
  </Dialog>
);

const EditDialog = ({ isOpen, onDialogClose, onSubmitEdit, featureData, fields }) => {
  const [data, setData] = useState(featureData);
  const handleEdit = (key, value) => setData({ ...data, [key]: value });
  return (
    <Dialog open={isOpen} onClose={onDialogClose}>
      <DialogTitle>Edit feature</DialogTitle>
      <DialogContent>
        <FormGroup>
          {fields.map(({ key, title }) => (
            <TextField
              key={key}
              defaultValue={featureData[key]}
              label={title}
              onChange={({ target: { value } }) => handleEdit(key, value)}
              disabled
              style={{ marginTop: 15 }}
            />
          ))}
        </FormGroup>
        <FormGroup>
          <Button onClick={() => onSubmitEdit({ ...featureData, ...data })}>Select</Button>
          <Button onClick={() => onDialogClose()}>Cancel</Button>
        </FormGroup>
      </DialogContent>
    </Dialog>
  );
};

const Header = ({ columnTitles }) => (
  <TableHead>
    <TableRow>
      {columnTitles.map(({ title, id }) => (
        <TableCell key={id}>{title}</TableCell>
      ))}
      <TableCell>Action</TableCell>
    </TableRow>
  </TableHead>
);

const Row = ({
  rowData,
  columns,
  backgroundColor,
  onEdit,
  onDelete,
  onDisable,
  onExportWKT,
  onToggleVisibility,
  onToggleFixLabelSize
}) => {
  if (backgroundColor) {
    return (
      <TableRow sx={{ backgroundColor: 'orange' }}>
        {columns.map(({ key }) => (
          <TableCell key={key}>{rowData[key]}</TableCell>
        ))}
        <TableCell>
          {onEdit && <EditButton handleClick={() => onEdit!(rowData.id)} />}
          {onDelete && <DeleteButton handleClick={() => onDelete!(rowData.id)} />}
          {onDisable && <DisableButton handleClick={() => onDisable!(rowData.id)} />}
          {onExportWKT && <ExportWKTButton handleClick={() => onExportWKT!(rowData.id)} />}
          {onToggleVisibility && (
            <ToggleVisibility handleClick={() => onToggleVisibility!(rowData.id)} />
          )}
          {onToggleFixLabelSize && (
            <ToggleFixLabelSize handleClick={() => onToggleFixLabelSize!(rowData.id)} />
          )}
        </TableCell>
      </TableRow>
    );
  }
  return (
    <TableRow>
      {columns.map(({ key }) => (
        <TableCell key={key}>{rowData[key]}</TableCell>
      ))}
      <TableCell>
        {onEdit && <EditButton handleClick={() => onEdit!(rowData.id)} />}
        {onDelete && <DeleteButton handleClick={() => onDelete!(rowData.id)} />}
        {onDisable && <DisableButton handleClick={() => onDisable!(rowData.id)} />}
        {onExportWKT && <ExportWKTButton handleClick={() => onExportWKT!(rowData.id)} />}
        {onToggleVisibility && (
          <ToggleVisibility handleClick={() => onToggleVisibility!(rowData.id)} />
        )}
      </TableCell>
    </TableRow>
  );
};

interface FeatureTableProps {
  data: any;
  fields: any;
  onEditFeature?: (data: any) => void;
  onDeleteSelectedFeature?: (data: any) => void;
  onDisableFeature?: (id: string) => void;
  onExportWKT?: (id: string) => void;
  onToggleVisibility?: (id: string) => void;
  onToggleFixLabelSize?: (id: string) => void;
  activeId?: string;
}

const FeatureTable = ({
  data,
  fields,
  onEditFeature,
  onDeleteSelectedFeature,
  onDisableFeature,
  onExportWKT,
  onToggleVisibility,
  onToggleFixLabelSize,
  activeId
}: FeatureTableProps) => {
  const [tableData, setTableData] = useState(data);
  const [dataFields] = useState(fields);
  const [deleteDialogOn, setDeleteDialogOn] = useState(false);
  const [editDialogOn, setEditDialogOn] = useState(false);
  const [featureIdToDelete, setFeatureIdToDelete] = useState();
  const [featureIdToEdit, setFeatureIdToEdit] = useState();
  const onEditDialogOpen = (id) => {
    setFeatureIdToEdit(id);
    setEditDialogOn(true);
  };
  const onDeleteDialogOpen = (id) => {
    setFeatureIdToDelete(id);
    setDeleteDialogOn(true);
  };
  const handleEdit = (featureData) => {
    setEditDialogOn(false);
    if (onEditFeature) {
      onEditFeature(featureData);
    }
  };
  const handleDelete = (featureData) => {
    setDeleteDialogOn(false);
    if (onDeleteSelectedFeature) {
      onDeleteSelectedFeature(featureData);
    }
  };

  useEffect(() => {
    setTableData(data);
  }, [data]);

  return (
    <div>
      <DeleteDialog
        isOpen={deleteDialogOn}
        onDialogClose={() => setDeleteDialogOn(false)}
        onConfirmDelete={handleDelete}
        featureData={tableData.find(({ id }) => id === featureIdToDelete) || {}}
      />
      <EditDialog
        isOpen={editDialogOn}
        onDialogClose={() => setEditDialogOn(false)}
        onSubmitEdit={handleEdit}
        featureData={tableData.find(({ id }) => id === featureIdToEdit) || {}}
        fields={dataFields}
      />
      <TableContainer>
        <Table>
          <Header columnTitles={dataFields} />
          <TableBody>
            {tableData.map((tData) => (
              <Row
                key={tData._id}
                rowData={tData}
                columns={dataFields}
                onEdit={onEditDialogOpen}
                onDelete={onDeleteDialogOpen}
                onDisable={onDisableFeature}
                onExportWKT={onExportWKT}
                onToggleVisibility={onToggleVisibility}
                onToggleFixLabelSize={onToggleFixLabelSize}
                backgroundColor={activeId === tData._id ? 'orange' : undefined}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default FeatureTable;

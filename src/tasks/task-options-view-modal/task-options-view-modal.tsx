import { isEmpty } from 'lodash';
import React from 'react';
import { Modal } from 'react-bootstrap';
import { ProcessingStagesValue } from '../enums';
import { TaskOptionsModalProps } from './types';
import {
  downscaleToAccuracyMapping,
  downscaleToQualityMapping,
  TaskOptionsMapping,
} from './constants';
import { TaskOptionsStages, TaskOptionsValues } from 'src/shared/api';
import { Formatter, getHorizontalAndVerticalCRS } from 'src/shared/helpers';
import { WKTCrsToNameMapping } from 'src/shared/constants';

export const ViewTaskOptionsModal: React.FC<TaskOptionsModalProps> = ({
  show,
  taskEndStage,
  taskOptions,
  onClose,
}) => {
  // Render.
  const reorderStages = (stages: string[]) => {
    const orderedStagesEnums = Object.values(TaskOptionsStages).map((value) =>
      value.toString(),
    );
    stages.sort(
      (a, b) => orderedStagesEnums.indexOf(a) - orderedStagesEnums.indexOf(b),
    );
  };

  const renderSetting = (settings, settingKey, settingCRS, index, stage) => {
    // Setting value.
    const settingValue = settings[settingKey];

    if (settingKey === TaskOptionsStages.TASK_PRESET_NAME) {
      return (
        <div key={settingKey + settingValue + index}>
          <div className="task-options__setting">
            <div className="task-options__setting-key">Task Preset</div>
            <div className="task-options__setting-value bold-txt">
              {settingValue}
            </div>
          </div>
        </div>
      );
    } else if (settingKey === TaskOptionsStages.MARKER_PROJECTION_ACCURACY) {
      return (
        <div key={settingKey + settingValue + index}>
          <div className="task-options__setting">
            <div className="task-options__setting-key">
              Marker Accuracy (pix)
            </div>
            <div className="task-options__setting-value bold-txt">
              {settingValue}
            </div>
          </div>
        </div>
      );
    } else if (settingKey === TaskOptionsValues.COORDINATE_SYSTEM) {
      let CRS;

      if (settingCRS && !isEmpty(settingCRS)) {
        CRS = {
          horizontal: settingCRS['horizontalCrs'],
          vertical: settingCRS['verticalCrs'],
        };
      } else {
        CRS = getHorizontalAndVerticalCRS(settingValue);
      }

      return (
        <div key={index}>
          <div className="task-options__setting">
            <div className="task-options__setting-key">Horizontal CRS</div>
            <div className="task-options__setting-value bold-txt">
              {CRS && CRS.horizontal}
            </div>
          </div>
          <div className="task-options__setting">
            <div className="task-options__setting-key">Vertical CRS</div>
            <div className="task-options__setting-value bold-txt">
              {CRS && CRS.vertical}
            </div>
          </div>
        </div>
      );
    } else if (stage === TaskOptionsStages.CAMERA_CALIBRATION) {
      const settingVal = settingValue ?? 'Auto-Calibrated';
      return (
        <div key={settingKey + settingValue} className="task-options__setting">
          <div className="task-options__setting-key">{settingKey}</div>
          <div className="task-options__setting-value bold-txt">
            {settingVal}
          </div>
        </div>
      );
    } else {
      let booleanVal = settingValue.toString();

      if (settingValue.toString() === 'true') {
        booleanVal = 'Yes';
      } else if (settingValue.toString() === 'false') {
        booleanVal = 'No';
      }

      let settingVal = booleanVal;

      if (stage === TaskOptionsStages.CAMERA_LOCATION_ACCURACY) {
        if (settingKey === TaskOptionsValues.X) {
          return null;
        } else if (settingKey === TaskOptionsValues.Y) {
          settingKey = TaskOptionsValues.HORIZONTAL_M;
        } else if (settingKey === TaskOptionsValues.Z) {
          settingKey = TaskOptionsValues.VERTICAL_M;
        }
      }
      if (settingKey === TaskOptionsValues.DOWNSCALE) {
        if (stage === TaskOptionsStages.ALIGN_PHOTOS) {
          settingKey = TaskOptionsValues.ACCURACY;
          settingVal = downscaleToAccuracyMapping[settingVal];
        } else if (stage === TaskOptionsStages.BUILD_DENSE_CLOUD) {
          settingKey = TaskOptionsValues.QUALITY;
          settingVal = downscaleToQualityMapping[settingVal];
        }
      }

      if (stage === TaskOptionsStages.ALIGN_PHOTOS) {
        if (settingKey === TaskOptionsValues.FILTER_STATIONARY_POINTS) {
          settingKey = TaskOptionsValues.EXCLUDE_STATIONARY_TIE_POINTS;
        } else if (settingKey === TaskOptionsValues.GUIDED_MATCHING) {
          settingKey = TaskOptionsValues.GUIDED_IMAGE_MATCHING;
        }
      }

      if (stage === TaskOptionsStages.EXPORT_ORTHOMOSAIC) {
        if (
          settingKey === TaskOptionsValues.BLOCK_HEIGHT ||
          settingKey === TaskOptionsValues.BLOCK_WIDTH
        ) {
          return null;
        }
        if (settingKey === TaskOptionsValues.SPLIT_IN_BLOCKS) {
          if (settings[TaskOptionsValues.SPLIT_IN_BLOCKS]) {
            settingVal =
              settings[TaskOptionsValues.BLOCK_HEIGHT] +
              '*' +
              settings[TaskOptionsValues.BLOCK_WIDTH];
          } else {
            settingVal = 'No';
          }
        }
      }

      return (
        <div key={settingKey + settingValue} className="task-options__setting">
          <div className="task-options__setting-key">
            {Formatter.toTitleCase(settingKey, '-')}
          </div>
          <div className="task-options__setting-value bold-txt">
            {settingVal}
          </div>
        </div>
      );
    }
  };

  const renderOptions = (): React.ReactElement => {
    let stages;
    const isStopAfterReoptimize =
      !!taskOptions[TaskOptionsStages.OPTIMIZATION_OPTIONS]?.[
        TaskOptionsValues.STOP_AFTER_REOPTIMIZE
      ];
    if (taskEndStage && taskEndStage in TaskOptionsMapping) {
      const allStages = [
        ProcessingStagesValue.AlignPhotos,
        ProcessingStagesValue.GeneratePointCloud,
        ProcessingStagesValue.GenerateOrthomosaic,
      ];

      // Array of all stages run.
      // Adding 1 since we want all items of array till matching endStage value.s
      const runStages = allStages.slice(
        0,
        1 + allStages.indexOf(taskEndStage as ProcessingStagesValue),
      );

      stages = [
        ...new Set(
          runStages.flatMap((stage) => [...TaskOptionsMapping[stage]]),
        ),
      ];
    } else if (isStopAfterReoptimize) {
      stages =
        TaskOptionsMapping[ProcessingStagesValue.StopAfterReOptimizeCamera];
    } else {
      stages = Object.keys(taskOptions);
      stages.splice(0, 2);
    }

    stages = stages.filter((stage: string) =>
      Object.keys(taskOptions).includes(stage),
    );

    reorderStages(stages);

    return stages.map((stage, i) => {
      // Extract settings of a stage.
      let settings = taskOptions[stage];
      if (
        [
          TaskOptionsStages.GEOTAG_INPUT_CRS.toString(),
          TaskOptionsStages.GCP_INPUT_CRS.toString(),
        ].includes(stage)
      ) {
        settings = {
          'coordinate-system': settings,
        };
      }

      if (TaskOptionsStages.MARKER_PROJECTION_ACCURACY == stage) {
        stage = TaskOptionsStages.IMAGE_COORDINATES_ACCURACY;
        settings = {
          'marker-projection-accuracy': settings,
        };
      }

      if (TaskOptionsStages.TASK_PRESET_NAME == stage) {
        settings = {
          'task-preset': settings,
        };
      }

      // Split stage name (i.e build-dem)
      const stageNameArray = stage.split('-');

      // Update dsm,dem to uppercase.
      if (
        ['DSM', 'DEM'].includes(
          stageNameArray[stageNameArray.length - 1].toLocaleUpperCase(),
        )
      ) {
        stageNameArray[stageNameArray.length - 1] =
          stageNameArray[stageNameArray.length - 1].toLocaleUpperCase();
      }

      const stageName = stageNameArray.join(' ');
      let settingCRS = {};

      const WKTCrs = settings[TaskOptionsValues.COORDINATE_SYSTEM];
      if (WKTCrs) {
        const inputCRS = WKTCrsToNameMapping[WKTCrs];
        if (!isEmpty(inputCRS)) {
          settingCRS = {
            horizontalCrs: inputCRS[0],
            verticalCrs: inputCRS[1],
          };
        }
      }

      return (
        <div key={stage + i} className="task-options-container">
          <div className="task-options__stage body-txt-2">{stageName}</div>
          <div className="line"></div>
          <div className="task-options__settings">
            {/* For each setting */}
            {Object.keys(settings).map((settingKey, index) =>
              renderSetting(settings, settingKey, settingCRS, index, stage),
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <>
      <Modal
        className="task-options-modal fade-scale"
        dialogClassName="task-options-modal-dialog"
        aria-labelledby="contained-modal-title-hcenter"
        show={show}
        centered
        keyboard
        scrollable
        onHide={onClose}
      >
        <Modal.Header closeButton>Task Options</Modal.Header>
        <Modal.Body>
          <>{renderOptions()}</>
        </Modal.Body>
      </Modal>
    </>
  );
};

import { EventSourcePolyfill } from 'event-source-polyfill';
import React, { useEffect, useState } from 'react';
import { saveAs } from 'file-saver';
import {
  Button,
  ButtonVariant,
  ColorClass,
  Icon,
  IconIdentifier,
  Spinner,
} from '@aus-platform/design-system';
import { EnvVariables } from 'src/shared/env-variables';
import { Task, useDownloadTaskLogsRequest } from 'src/shared/api';
import { logServiceAuthHeader } from 'src/shared/helpers';

type TaskOutputProps = {
  onClose: () => void;
  task: Task;
  disableDownload?: boolean;
};

export const TaskOutput: React.FC<TaskOutputProps> = ({
  onClose,
  task,
  disableDownload = true,
}) => {
  // States.
  const [logs, setLogs] = useState<string>('');

  // Api.
  const {
    data: taskLogFile,
    isSuccess: isSuccessDownloadTaskLogsFile,
    refetch: fetchTaskLogsFile,
  } = useDownloadTaskLogsRequest(task.logStreamName, task.id);

  // useEffect - Mount.
  useEffect(() => {
    const authHeader = logServiceAuthHeader();
    const sseUrl =
      EnvVariables.logServerUrl?.toString() +
      `/get_logs?stream=${task.logStreamName}&is_rainbow=true`;

    const sse = new EventSourcePolyfill(sseUrl, {
      headers: authHeader,
    });

    sse.onmessage = (sseMessage) => {
      setLogs((prev) => {
        const logsArray = prev.split('\n');
        if (logsArray.length >= 200) {
          logsArray.splice(0, logsArray.length - 200);
        }
        return logsArray.join('\n') + '\n' + sseMessage.data;
      });
    };

    sse.onerror = () => {
      sse.close();
    };

    return () => {
      if (sse) {
        sse.close();
      }
    };
  }, []);

  useEffect(() => {
    if (taskLogFile && isSuccessDownloadTaskLogsFile) {
      const taskLogFileBlob = new Blob([taskLogFile.data], {
        type: 'text/plain;charset=utf-8',
      });
      saveAs(taskLogFileBlob, task.name + task.id + '.txt');
    }
  }, [isSuccessDownloadTaskLogsFile, taskLogFile]);

  // Handlers.
  const onDownloadClick = (e) => {
    e.preventDefault();
    fetchTaskLogsFile();
  };

  // Render.
  const renderLogs = logs
    .split('\n')
    .map((logLine, index) => <div key={index}>{logLine}</div>);

  return (
    <div className="task-output">
      <div className="task-output__header">
        <div className="task-output__header-txt">Task Output</div>
        <Button
          leftIconIdentifier={IconIdentifier.CloudDownload}
          variant={ButtonVariant.Outline}
          onClick={onDownloadClick}
          disabled={disableDownload}
        >
          Download
        </Button>
        <Icon
          size={18}
          colorClass={ColorClass.Neutral300}
          identifier={IconIdentifier.XCircle}
          onClick={onClose}
        />
      </div>
      <div className="task-output__logs">
        {logs ? renderLogs : <Spinner size="sm" />}
      </div>
    </div>
  );
};

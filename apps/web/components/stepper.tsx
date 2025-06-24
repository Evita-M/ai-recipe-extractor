import React from 'react';
import { FileSearch, Languages, Send } from 'lucide-react';

import { LoadingDots } from '@workspace/ui/components/loading-dots';

export enum StepType {
  PARSE_RECIPE = 'parse_recipe_from_url',
  TRANSLATE_RECIPE = 'translate_recipe',
  PUBLISH_RECIPE = 'publish_recipe_to_notion',
}
export enum StepStatus {
  IDLE = 'idle',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export const initialStepStatuses: Record<StepType, StepStatus> = {
  [StepType.PARSE_RECIPE]: StepStatus.IDLE,
  [StepType.TRANSLATE_RECIPE]: StepStatus.IDLE,
  [StepType.PUBLISH_RECIPE]: StepStatus.IDLE,
};

const COMPLETED_COLOR = '#71BC78';
const FAILED_COLOR = '#EF4444';
const IDLE_COLOR = '#d7ddd9'; // Tailwind's zinc-300
const IN_PROGRESS_COLOR = '#a5d5a9'; // Tailwind's yellow-400

const stepMeta = [
  {
    type: StepType.PARSE_RECIPE,
    label: 'Parsing',
    icon: FileSearch,
  },
  {
    type: StepType.TRANSLATE_RECIPE,
    label: 'Translating',
    icon: Languages,
  },
  {
    type: StepType.PUBLISH_RECIPE,
    label: 'Publishing',
    icon: Send,
  },
] as const;

function getStepStyles(status: StepStatus) {
  switch (status) {
    case StepStatus.COMPLETED:
      return {
        icon: 'text-white',
        backgroundColor: COMPLETED_COLOR,
      };
    case StepStatus.FAILED:
      return { icon: 'text-white', backgroundColor: FAILED_COLOR };
    case StepStatus.IN_PROGRESS:
      return {
        icon: 'text-white',
        backgroundColor: IN_PROGRESS_COLOR,
      };
    default:
      return {
        icon: 'text-white',
        backgroundColor: IDLE_COLOR,
      };
  }
}

function computeStepStatuses(
  backendStatuses: Partial<Record<StepType, StepStatus>>
): Record<StepType, StepStatus> {
  const steps: StepType[] = [
    StepType.PARSE_RECIPE,
    StepType.TRANSLATE_RECIPE,
    StepType.PUBLISH_RECIPE,
  ];

  let foundInProgress = false;
  let foundFailed = false;
  const result: Record<StepType, StepStatus> = {} as any;

  for (const step of steps) {
    const backendStatus = backendStatuses[step];
    if (foundFailed) {
      result[step] = StepStatus.IDLE;
    } else if (backendStatus === StepStatus.FAILED) {
      result[step] = StepStatus.FAILED;
      foundFailed = true;
    } else if (backendStatus === StepStatus.COMPLETED) {
      result[step] = StepStatus.COMPLETED;
    } else if (!foundInProgress) {
      result[step] = StepStatus.IN_PROGRESS;
      foundInProgress = true;
    } else {
      result[step] = StepStatus.IDLE;
    }
  }
  return result;
}

interface StepperProps {
  stepStatuses: Partial<Record<StepType, StepStatus>>;
  showTranslationStep?: boolean;
}

export const Stepper: React.FC<StepperProps> = ({
  stepStatuses,
  showTranslationStep = true,
}) => {
  const filteredStepMeta = stepMeta.filter(
    (step) => showTranslationStep || step.type !== StepType.TRANSLATE_RECIPE
  );
  const filteredStepTypes = filteredStepMeta.map((s) => s.type);

  const computedStatuses = Object.fromEntries(
    filteredStepTypes.map((type) => [type, stepStatuses[type] || 'idle'])
  ) as Record<StepType, StepStatus>;

  // Check if all visible steps are completed
  const allCompleted =
    computedStatuses[StepType.PARSE_RECIPE] === StepStatus.COMPLETED &&
    computedStatuses[StepType.PUBLISH_RECIPE] === StepStatus.COMPLETED;

  return (
    <div className="flex gap-0 justify-center items-center w-full">
      {filteredStepMeta.map(({ type, icon: Icon }, idx) => {
        const status = computedStatuses[type];
        const { backgroundColor } = getStepStyles(status);

        let showStreaming = false;
        if (!allCompleted && idx < filteredStepMeta.length - 1) {
          const nextType = filteredStepMeta[idx + 1]?.type;
          const nextStatus = nextType ? computedStatuses[nextType] : undefined;
          const anyInProgress = filteredStepTypes.some(
            (type) => computedStatuses[type] === StepStatus.IN_PROGRESS
          );
          const anyIdle = filteredStepTypes.some(
            (type) => computedStatuses[type] === StepStatus.IDLE
          );
          if (
            !anyInProgress &&
            anyIdle &&
            status === StepStatus.COMPLETED &&
            nextStatus === StepStatus.IDLE
          ) {
            showStreaming = true;
          }
        }

        return (
          <React.Fragment key={type}>
            <div className="flex flex-col items-center w-[80px]">
              <div
                className={`flex justify-center items-center w-[60px] h-[60px] rounded-full transition-all duration-300 ${
                  status === StepStatus.IN_PROGRESS
                    ? 'animate-pulse scale-110'
                    : ''
                }`}
                style={{ backgroundColor }}
              >
                <Icon className={`w-6 h-6 text-white`} />
              </div>
            </div>
            {idx < filteredStepMeta.length - 1 && (
              <div className="flex justify-center items-center w-[80px]">
                <LoadingDots
                  color={showStreaming ? IN_PROGRESS_COLOR : IDLE_COLOR}
                  size={44}
                  isAnimated={showStreaming ? true : false}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

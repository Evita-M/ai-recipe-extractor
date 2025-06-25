import React from 'react';
import { FileSearch, Languages, Send } from 'lucide-react';
import { LoadingDots } from '@workspace/ui/components/loading-dots';

export enum StepType {
  EXTRACT_RECIPE = 'extract_structured_output',
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
  [StepType.EXTRACT_RECIPE]: StepStatus.IDLE,
  [StepType.TRANSLATE_RECIPE]: StepStatus.IDLE,
  [StepType.PUBLISH_RECIPE]: StepStatus.IDLE,
};

const COMPLETED_COLOR = {
  text: 'var(--success-foreground)',
  background: 'var(--success)',
};
const FAILED_COLOR = {
  text: 'var(--destructive-foreground)',
  background: 'var(--destructive)',
};
const IDLE_COLOR = {
  text: 'var(--muted-foreground)',
  background: 'var(--muted)',
};
const IN_PROGRESS_COLOR = {
  text: 'var(--info-foreground)',
  background: 'var(--info)',
};

const stepMeta = [
  {
    type: StepType.EXTRACT_RECIPE,
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
        iconColor: COMPLETED_COLOR.text,
        backgroundColor: COMPLETED_COLOR.background,
      };
    case StepStatus.FAILED:
      return {
        iconColor: FAILED_COLOR.text,
        backgroundColor: FAILED_COLOR.background,
      };
    case StepStatus.IN_PROGRESS:
      return {
        iconColor: IN_PROGRESS_COLOR.text,
        backgroundColor: IN_PROGRESS_COLOR.background,
      };
    default:
      return {
        iconColor: IDLE_COLOR.text,
        backgroundColor: IDLE_COLOR.background,
      };
  }
}

function computeStepStatuses(
  backendStatuses: Partial<Record<StepType, StepStatus>>
): Record<StepType, StepStatus> {
  const steps: StepType[] = [
    StepType.EXTRACT_RECIPE,
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
    computedStatuses[StepType.EXTRACT_RECIPE] === StepStatus.COMPLETED &&
    computedStatuses[StepType.PUBLISH_RECIPE] === StepStatus.COMPLETED;

  return (
    <div className="flex gap-0 justify-center items-center w-full">
      {filteredStepMeta.map(({ type, icon: Icon }, idx) => {
        const status = computedStatuses[type];
        const { backgroundColor, iconColor } = getStepStyles(status);

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
                style={{ backgroundColor: backgroundColor }}
              >
                <Icon className="w-6 h-6" style={{ color: iconColor }} />
              </div>
            </div>
            {idx < filteredStepMeta.length - 1 && (
              <div className="flex justify-center items-center w-[80px]">
                <LoadingDots
                  color={
                    showStreaming
                      ? IN_PROGRESS_COLOR.background
                      : IDLE_COLOR.text
                  }
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

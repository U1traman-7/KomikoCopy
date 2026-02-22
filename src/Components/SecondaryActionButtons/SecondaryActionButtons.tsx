import { Button, ButtonGroup } from "@nextui-org/react";
import { SecondaryAction } from "../../constants";
import { Maximize, Minimize, Redo, Undo } from "../../icons";
import { useAtom } from "jotai";
import { prevStepsAtom, redoStepsAtom } from "../../state";
import { useTranslation } from "react-i18next";

interface SecondaryActionButtonsProps {
  onActionChange: (action: SecondaryAction) => void;
}

export default function SecondaryActionButtons({
  onActionChange,
}: SecondaryActionButtonsProps) {
  const [prevSteps, setPrevSteps] = useAtom(prevStepsAtom)
  const [redoSteps, setRedoSteps] = useAtom(redoStepsAtom)
  const { t } = useTranslation('create');

  return (
    <div className="flex gap-1.5">
      {/*
      <ButtonGroup size="sm" variant="flat">
        <Button className="w-7 h-7" size="sm" isIconOnly={true}
          onClick={() => onActionChange(SecondaryAction.ZoomOut)}
          aria-label="minimize"
        >
          <Minimize />
        </Button>
        <Button className="w-7 h-7" size="sm"
          onClick={() => onActionChange(SecondaryAction.ResetZoom)}
        >
          100%
        </Button>
        <Button className="w-7 h-7" size="sm" isIconOnly={true}
          aria-label="maximize"

          onClick={() => onActionChange(SecondaryAction.ZoomIn)}
        ><Maximize /></Button>
      </ButtonGroup> */}
      <ButtonGroup size="sm" variant="flat">
        <Button className="w-7 h-7" size="sm" isIconOnly={true}
          aria-label={t('undo')}

          onClick={() => onActionChange(SecondaryAction.Undo)}
        ><Undo /></Button>
        {/* {prevSteps.length} */}
        <Button className="w-7 h-7" size="sm" isIconOnly={true}
          aria-label={t('redo')}

          onClick={() => onActionChange(SecondaryAction.Redo)}
        ><Redo /></Button>
        {/* {redoSteps.length} */}
      </ButtonGroup>
    </div>
  );
}

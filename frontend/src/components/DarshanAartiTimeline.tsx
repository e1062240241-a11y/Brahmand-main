import React from 'react';
import { DarshanAartiSchedule, AartiItem } from './DarshanAartiSchedule';

export type { AartiItem };

interface DarshanAartiTimelineProps {
  establishedYear?: string;
  entryFeeText?: string;
  bestTimeText?: string;
  openingTime?: string;
  closingTime?: string;
  generalDarshanText?: string;
  aartis?: AartiItem[];
  vipInfoText?: string;
}

export const DarshanAartiTimeline: React.FC<DarshanAartiTimelineProps> = ({
  openingTime = '4:00 AM',
  closingTime = '9:00 PM',
  generalDarshanText,
  aartis,
  vipInfoText,
}) => {
  return (
    <DarshanAartiSchedule
      openingTime={openingTime}
      closingTime={closingTime}
      generalDarshanText={generalDarshanText}
      aartis={aartis}
      vipInfoText={vipInfoText}
    />
  );
};


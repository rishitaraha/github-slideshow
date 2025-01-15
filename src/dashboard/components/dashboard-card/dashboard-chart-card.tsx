import { DashboardChartCardProps } from './types';
import { DashboardCard } from '.';

export const DashboardChartCard: React.FC<DashboardChartCardProps> = ({
  title,
  unit,
  headerChildren,
  isLoading,
  children,
}) => {
  return (
    <DashboardCard>
      <DashboardCard.Header>
        <DashboardCard.Title title={title} unit={unit} />
        {headerChildren}
      </DashboardCard.Header>
      <DashboardCard.Body isLoading={isLoading}>{children}</DashboardCard.Body>
    </DashboardCard>
  );
};

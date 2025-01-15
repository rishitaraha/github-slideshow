import { Image } from '../../../../../../assets';

export const PrintFooter: React.FC = () => {
  return (
    <div className="print-footer">
      <div className="print-footer__company">
        Powered by{' '}
        <img
          src={Image.AereoCloudLogoBlue}
          className="print-footer__company__logo"
        />
      </div>
    </div>
  );
};

import { ColorCodes } from '@aus-platform/design-system';
import { isNil } from 'lodash';

export const getContentToBePrinted = ({
  dataset,
  financialYear,
  orgLogoBase64String,
  aereoLogoBase64String,
  printContentImgSrc,
}) => {
  const printStyle = `<style>
  .full-page-capture{
    height: fit-content;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .full-page-capture__content{
    margin-top: 1rem;
    height: 85vh;
    object-fit: contain;
    width: calc(100% - 1rem);
  }

  .full-page-capture__header__text, .full-page-capture__header__text > *{
    font-size: 1.2rem;
  }

  .full-page-capture__header{
    display: flex;
    justify-content: space-between;
  }

  .full-page-capture__header__logo{
    width: 7rem;
    object-fit: contain;
  }

  .full-page-capture__footer{
    display: flex;
    align-items: center;
    justify-content: flex-end;
    width: calc(100% - 1rem);
    padding-top: 0.5rem;
    border-top: 1px solid ${ColorCodes.Neutral150};
    color: ${ColorCodes.Neutral250};
    background: white;
  }

  .full-page-capture__footer__logo{
    height: 1rem;
    margin-left: 0.5rem;
  }

  @media print{
    * {
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    @page {
      size: A4 portrait;
      margin: 1cm;
    }

    html{
      font-size: 10px;
    }
  }
  </style>`;

  const footer = !isNil(orgLogoBase64String)
    ? `
      <div class="full-page-capture__footer">
        Report powered by
        <img src=${aereoLogoBase64String} class="full-page-capture__footer__logo" />
      </div>
      `
    : '';

  const printHtml = `
  <html>

  <head>
    <title>Dashboard-Report-${dataset.project?.label}-${
      dataset.site?.label
    }</title>${printStyle}
  </head>

  <body>
    <div class='full-page-capture'>
      <div>
        <div class="full-page-capture__header">
          <div class="full-page-capture__header__text">
            <h1>Dashboard KPI Report</h1>
            <b>Project: </b> ${dataset.project?.label}
            <br />
            <b>Site: </b> ${dataset.site?.label} <br />
            <b>Financial Year: </b> ${financialYear} <br />
          </div>
          <img src=${
            !isNil(orgLogoBase64String)
              ? orgLogoBase64String
              : aereoLogoBase64String
          }
            class="full-page-capture__header__logo" />
        </div>
        <img src="${printContentImgSrc}" class='full-page-capture__content' />
      </div>
      ${footer}
    </div>
  </body>

  </html>
`;

  return {
    printHtml,
  };
};

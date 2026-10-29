import {
  ModuleFields,
  TextField,
  FileField,
  FieldGroup,
  ColorField,
} from '@hubspot/cms-components/fields';
import { Island } from '@hubspot/cms-components';
// @ts-expect-error -- ?island not typed
import PdfPagesIsland from './islands/PdfPages?island';
import { placeholderStyle } from './styles';

interface FieldValues {
  heading?: string;
  pdf?: string | null;
  styles?: {
    backgroundColor?: { css?: string };
  };
}

interface Props {
  fieldValues: FieldValues;
  hublData: {
    isInEditor: boolean;
  };
}

function getFileName(url: string): string {
  const lastSegment = url.split(/[?#]/)[0].split('/').pop() || url;
  try {
    return decodeURIComponent(lastSegment);
  } catch {
    return lastSegment;
  }
}

function isPdfUrl(url: string): boolean {
  try {
    return new URL(url).pathname.toLowerCase().endsWith('.pdf');
  } catch {
    return false;
  }
}

export function Component({ fieldValues, hublData }: Props) {
  const pdfUrl = fieldValues.pdf?.trim() ?? '';
  const isPdf = isPdfUrl(pdfUrl);

  if (!hublData.isInEditor && !isPdf) {
    return null;
  }

  const fileName = getFileName(pdfUrl);

  return (
    <div
      style={{
        backgroundColor: fieldValues.styles?.backgroundColor?.css || 'transparent',
        padding: 'calc(var(--spacing-unit) * 3) calc(var(--spacing-unit) * 4)',
      }}
    >
      {fieldValues.heading && (
        <h2 className='section-header'>{fieldValues.heading}</h2>
      )}
      {!pdfUrl ? (
        <div style={placeholderStyle}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>No PDF selected</div>
          <div style={{ opacity: 0.7, fontSize: '0.875em' }}>
            Select a PDF using the PDF File field in the module settings.
          </div>
        </div>
      ) : !isPdf ? (
        <div style={placeholderStyle}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>The selected file isn't a PDF</div>
          <div style={{ opacity: 0.7, fontSize: '0.875em' }}>
            {fileName} can't be displayed. Select a PDF using the PDF File field in the module settings.
          </div>
        </div>
      ) : hublData.isInEditor ? (
        <div style={{ ...placeholderStyle, borderStyle: 'solid' }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{fileName}</div>
          <div style={{ opacity: 0.7, fontSize: '0.875em' }}>
            Buyers will be able to view this PDF on the published quote.
          </div>
        </div>
      ) : (
        <Island module={PdfPagesIsland} hydrateOn='load' pdfUrl={pdfUrl} fileName={fileName} />
      )}
    </div>
  );
}

export const fields = (
  <ModuleFields>
    <TextField name='heading' label='Heading (optional)' default='' />
    <FileField
      name='pdf'
      label='PDF File'
      picker='document'
      helpText='Only PDF files can be displayed on the quote.'
    />
    <FieldGroup name='styles' label='Styles' tab='STYLE'>
      <ColorField name='backgroundColor' label='Background Color' />
    </FieldGroup>
  </ModuleFields>
);

export const meta = {
  label: 'Embedded PDF',
  content_types: ['QUOTE', 'QUOTE_BLUEPRINT'],
};

export const hublDataTemplate = `
  {% set hublData = {
    "isInEditor": is_in_editor
  } %}
`;

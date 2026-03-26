import { readFile } from 'node:fs/promises';
import { Prisma } from '@prisma/client';

const SOURCE = 'bags';
const CREATE_WRITE_FIELDS = [
  'source',
  'sourceProjectId',
  'sourceUrl',
  'name',
  'description',
  'category',
  'iconUrl',
  'twitterUrl',
  'createdAtFromSource',
  'sourceStatus',
  'tokenAddress',
  'rawPayload',
];
const UPDATE_WRITE_FIELDS = [
  'sourceUrl',
  'name',
  'description',
  'category',
  'iconUrl',
  'twitterUrl',
  'createdAtFromSource',
  'sourceStatus',
  'tokenAddress',
  'rawPayload',
];

function inferPayloadType(fieldName) {
  if (fieldName === 'createdAtFromSource') return 'DateTime';
  if (fieldName === 'rawPayload') return 'Json';
  return 'String';
}

export function buildImportedProjectPayloadAudit() {
  const model = Prisma.dmmf.datamodel.models.find((entry) => entry.name === 'ImportedProject');
  if (!model) {
    return {
      error: 'ImportedProject model not found in Prisma schema/client',
      createFields: CREATE_WRITE_FIELDS,
      updateFields: UPDATE_WRITE_FIELDS,
      fieldAudit: [],
      mismatches: ['ImportedProject model not found in Prisma schema/client'],
      requiredInSchemaMissingFromCreate: [],
      optionalInSchemaSafelyNullable: [],
    };
  }

  const schemaFields = new Map(model.fields.map((field) => [field.name, field]));
  const fieldAudit = [];
  const mismatches = [];

  for (const fieldName of CREATE_WRITE_FIELDS) {
    const schemaField = schemaFields.get(fieldName);
    if (!schemaField) {
      fieldAudit.push({
        field: fieldName,
        createPath: true,
        updatePath: UPDATE_WRITE_FIELDS.includes(fieldName),
        classification: 'missing_from_schema',
        details: 'Field is written by import payload but does not exist in ImportedProject schema.',
      });
      mismatches.push(`create payload field "${fieldName}" is missing from ImportedProject schema`);
      continue;
    }

    const expectedType = inferPayloadType(fieldName);
    const schemaType = schemaField.type;
    if (expectedType !== schemaType) {
      fieldAudit.push({
        field: fieldName,
        createPath: true,
        updatePath: UPDATE_WRITE_FIELDS.includes(fieldName),
        classification: 'wrong_type',
        details: `Payload expects ${expectedType} but schema type is ${schemaType}.`,
      });
      mismatches.push(
        `payload field "${fieldName}" type mismatch: payload=${expectedType}, schema=${schemaType}`,
      );
      continue;
    }

    fieldAudit.push({
      field: fieldName,
      createPath: true,
      updatePath: UPDATE_WRITE_FIELDS.includes(fieldName),
      classification: 'valid_present_in_schema',
      details: `Schema type ${schemaType}${schemaField.isRequired ? ' (required)' : ' (optional)'}.`,
    });
  }

  for (const fieldName of UPDATE_WRITE_FIELDS) {
    if (!CREATE_WRITE_FIELDS.includes(fieldName)) {
      const schemaField = schemaFields.get(fieldName);
      if (!schemaField) {
        fieldAudit.push({
          field: fieldName,
          createPath: false,
          updatePath: true,
          classification: 'missing_from_schema',
          details: 'Field is written on update but does not exist in ImportedProject schema.',
        });
        mismatches.push(`update payload field "${fieldName}" is missing from ImportedProject schema`);
      }
    }
  }

  const createSet = new Set(CREATE_WRITE_FIELDS);
  const requiredInSchemaMissingFromCreate = model.fields
    .filter((field) => field.isRequired)
    .filter((field) => !field.isId && !field.isUpdatedAt && !field.hasDefaultValue)
    .filter((field) => !createSet.has(field.name))
    .map((field) => field.name);

  for (const fieldName of requiredInSchemaMissingFromCreate) {
    mismatches.push(`required schema field "${fieldName}" is missing from create payload`);
  }

  const optionalInSchemaSafelyNullable = model.fields
    .filter((field) => !field.isRequired)
    .map((field) => field.name);

  return {
    createFields: CREATE_WRITE_FIELDS,
    updateFields: UPDATE_WRITE_FIELDS,
    fieldAudit,
    mismatches,
    requiredInSchemaMissingFromCreate,
    optionalInSchemaSafelyNullable,
  };
}

function extractPrismaFailureDetails(errorMessage) {
  const message = typeof errorMessage === 'string' ? errorMessage : '';
  const unknownArgumentMatch = message.match(/Unknown argument `([^`]+)`/);
  if (unknownArgumentMatch) {
    return {
      failingField: unknownArgumentMatch[1],
      reasonType: 'unknown_argument',
    };
  }

  const missingArgumentMatch = message.match(/Argument `([^`]+)` is missing/);
  if (missingArgumentMatch) {
    return {
      failingField: missingArgumentMatch[1],
      reasonType: 'missing_required_argument',
    };
  }

  return {
    failingField: null,
    reasonType: 'unknown',
  };
}

function nonEmptyString(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function coalesce(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null) return value;
  }
  return null;
}

export function normalizeProject(project, index) {
  const list = project?.list ?? {};
  const detail = project?.detail?.response ?? {};

  const uuid = nonEmptyString(coalesce(detail.uuid, list.uuid, project?.uuid));
  const name = nonEmptyString(coalesce(detail.name, list.name));
  const description = nonEmptyString(coalesce(detail.description, list.description));
  const category = nonEmptyString(coalesce(detail.category, list.category));
  const iconUrl = nonEmptyString(coalesce(detail.icon, list.icon));
  const twitterUrl = nonEmptyString(coalesce(detail.twitterUrl, list.twitterUrl));
  const createdAtRaw = nonEmptyString(detail.createdAt);

  const missing = [];
  if (!uuid) missing.push('uuid');
  if (!name) missing.push('name');
  if (!description) missing.push('description');
  if (!category) missing.push('category');
  if (!iconUrl) missing.push('icon');
  if (!twitterUrl) missing.push('twitterUrl');
  if (!createdAtRaw) missing.push('createdAt');

  let createdAtFromSource = null;
  if (createdAtRaw) {
    const date = new Date(createdAtRaw);
    if (Number.isNaN(date.getTime())) {
      missing.push('createdAt(invalid)');
    } else {
      createdAtFromSource = date;
    }
  }

  if (missing.length > 0) {
    return {
      ok: false,
      reason: `Missing/invalid required fields: ${missing.join(', ')}`,
      index,
      uuid: uuid ?? null,
    };
  }

  const sourceStatus = nonEmptyString(coalesce(detail.status, list.status));
  const tokenAddress = nonEmptyString(coalesce(detail.tokenAddress, list.tokenAddress));

  return {
    ok: true,
    data: {
      source: SOURCE,
      sourceProjectId: uuid,
      sourceUrl: `https://bags.fm/apps/${uuid}`,
      name,
      description,
      category,
      iconUrl,
      twitterUrl,
      createdAtFromSource,
      sourceStatus,
      tokenAddress,
      rawPayload: project,
    },
  };
}

export async function readProjectsFromFile(inputFile) {
  const raw = await readFile(inputFile, 'utf8');
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed?.projects) ? parsed.projects : [];
}

export async function importBagsProjects({ prisma, projects }) {
  const payloadAudit = buildImportedProjectPayloadAudit();
  if (payloadAudit.mismatches.length > 0) {
    return {
      total: projects.length,
      imported: 0,
      updated: 0,
      rejected: projects.length,
      rejectedRows: [],
      rowErrors: [],
      payloadAudit,
    };
  }

  const normalized = projects.map((project, index) => normalizeProject(project, index));
  const validRows = normalized.filter((entry) => entry.ok).map((entry) => entry.data);
  const rejectedRows = normalized.filter((entry) => !entry.ok);

  let imported = 0;
  let updated = 0;
  const rowErrors = [];

  for (const row of validRows) {
    let failingStep = 'findUnique';
    try {
      const existing = await prisma.importedProject.findUnique({
        where: {
          source_sourceProjectId: {
            source: row.source,
            sourceProjectId: row.sourceProjectId,
          },
        },
        select: { id: true },
      });

      if (existing) {
        failingStep = 'update';
        await prisma.importedProject.update({
          where: {
            source_sourceProjectId: {
              source: row.source,
              sourceProjectId: row.sourceProjectId,
            },
          },
          data: {
            sourceUrl: row.sourceUrl,
            name: row.name,
            description: row.description,
            category: row.category,
            iconUrl: row.iconUrl,
            twitterUrl: row.twitterUrl,
            createdAtFromSource: row.createdAtFromSource,
            sourceStatus: row.sourceStatus,
            tokenAddress: row.tokenAddress,
            rawPayload: row.rawPayload,
          },
        });
        updated += 1;
      } else {
        failingStep = 'create';
        await prisma.importedProject.create({
          data: row,
        });
        imported += 1;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const failureDetails = extractPrismaFailureDetails(errorMessage);
      rowErrors.push({
        uuid: row.sourceProjectId,
        reason: errorMessage,
        failingField: failureDetails.failingField,
        failingStep,
        reasonType: failureDetails.reasonType,
      });
    }
  }

  return {
    total: projects.length,
    imported,
    updated,
    rejected: rejectedRows.length + rowErrors.length,
    rejectedRows,
    rowErrors,
    payloadAudit,
  };
}

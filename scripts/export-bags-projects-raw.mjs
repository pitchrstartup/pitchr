import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = 'https://api2.bags.fm/api/v1';
const OUTPUT_FILE = 'data/bags-projects.raw.json';
const MAX_RETRIES = 3;

let errorsCount = 0;

async function fetchJsonWithRetry(url, attempt = 1) {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (attempt < MAX_RETRIES) {
      console.warn(`Retrying (${attempt}/${MAX_RETRIES - 1}) for ${url}: ${error.message}`);
      return fetchJsonWithRetry(url, attempt + 1);
    }

    throw error;
  }
}

async function run() {
  console.log('Starting Bags raw project export...');

  const firstPageUrl = `${BASE_URL}/hackathon/list?page=1`;
  const firstPage = await fetchJsonWithRetry(firstPageUrl);

  const totalPages = Number(firstPage?.data?.totalPages || 1);
  const applications = [...(firstPage?.data?.applications || [])];

  console.log(`Pages fetched: 1/${totalPages}`);

  for (let page = 2; page <= totalPages; page += 1) {
    const pageUrl = `${BASE_URL}/hackathon/list?page=${page}`;

    try {
      const pageResult = await fetchJsonWithRetry(pageUrl);
      const pageApplications = pageResult?.data?.applications || [];
      applications.push(...pageApplications);
      console.log(`Pages fetched: ${page}/${totalPages}`);
    } catch (error) {
      errorsCount += 1;
      console.error(`Failed to fetch list page ${page}: ${error.message}`);
    }
  }

  console.log(`Projects found in list responses: ${applications.length}`);

  const projects = [];
  let detailsFetched = 0;

  for (let index = 0; index < applications.length; index += 1) {
    const listItem = applications[index];
    const uuid = listItem?.uuid;

    if (!uuid) {
      errorsCount += 1;
      console.error(`Skipping project at index ${index}: missing uuid`);
      continue;
    }

    const detailUrl = `${BASE_URL}/hackathon/${uuid}`;

    try {
      const detail = await fetchJsonWithRetry(detailUrl);
      projects.push({
        uuid,
        list: listItem,
        detail,
      });
      detailsFetched += 1;

      if (detailsFetched % 25 === 0 || detailsFetched === applications.length) {
        console.log(`Details fetched: ${detailsFetched}/${applications.length}`);
      }
    } catch (error) {
      errorsCount += 1;
      console.error(`Failed to fetch detail for ${uuid}: ${error.message}`);
      projects.push({
        uuid,
        list: listItem,
        detail: null,
      });
    }
  }

  const dataset = {
    meta: {
      fetchedAt: new Date().toISOString(),
      totalProjects: projects.length,
    },
    projects,
  };

  await mkdir('data', { recursive: true });
  await writeFile(OUTPUT_FILE, `${JSON.stringify(dataset, null, 2)}\n`, 'utf8');

  console.log('--- Export complete ---');
  console.log(`Pages fetched: ${totalPages}/${totalPages}`);
  console.log(`Projects found: ${applications.length}`);
  console.log(`Details fetched: ${detailsFetched}`);
  console.log(`Errors count: ${errorsCount}`);
  console.log(`Output file: ${OUTPUT_FILE}`);
}

run().catch((error) => {
  console.error('Fatal export error:', error.message);
  process.exitCode = 1;
});

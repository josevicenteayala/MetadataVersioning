import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir } from 'node:fs/promises'
import { generate } from 'openapi-typescript-codegen'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  const projectRoot = path.resolve(__dirname, '..')
  const specPath = path.resolve(
    projectRoot,
    '..',
    '..',
    'specs',
    '001-metadata-version-api',
    'contracts',
    'openapi.yaml',
  )
  const outputPath = path.resolve(projectRoot, 'src', 'services', 'generated')

  await mkdir(outputPath, { recursive: true })

  await generate({
    input: specPath,
    output: outputPath,
    httpClient: 'axios',
    useOptions: true,
    useUnionTypes: true,
    exportCore: true,
    exportSchemas: true,
    exportServices: true,
    postfixServices: 'Client',
  })

  console.log(`Generated client from ${specPath} → ${outputPath}`)
}

main().catch((error) => {
  console.error('Failed to generate API client', error)
  process.exitCode = 1
})

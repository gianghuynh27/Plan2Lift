/* eslint-disable no-console */

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import config from '../config/config';
import dbConnect from '../db/db-connect';
import Exercise from '../models/exercise.model';

import {
  exerciseImportSchema,
  type ExerciseImportInput,
} from '../schemas/exercise-import.schema';

const EXERCISE_SOURCE = 'exercise-db';

function getDataDirectory(): string {
  const directory = process.env.EXERCISE_DATA_DIRECTORY;

  if (!directory) {
    throw new Error('EXERCISE_DATA_DIRECTORY is not configured');
  }

  return path.resolve(directory);
}

async function readExercises(
  directory: string,
): Promise<ExerciseImportInput[]> {
  const fileNames = (await readdir(directory))
    .filter((fileName) => /^exercises\d+\.json$/i.test(fileName))
    .sort((left, right) =>
      left.localeCompare(right, undefined, {
        numeric: true,
      }),
    );

  if (fileNames.length === 0) {
    throw new Error(`No exercise JSON files found in ${directory}`);
  }

  const batches = await Promise.all(
    fileNames.map(async (fileName) => {
      const filePath = path.join(directory, fileName);

      const contents = await readFile(filePath, 'utf8');

      const records: unknown = JSON.parse(contents);

      if (!Array.isArray(records)) {
        throw new Error(`${fileName} must contain an array`);
      }

      console.log(`${fileName}: ${records.length} records`);

      return records;
    }),
  );

  const records = batches.flat();

  return records.map((record, index) => {
    const result = exerciseImportSchema.safeParse(record);

    if (!result.success) {
      const issues = result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ');

      throw new Error(`Invalid exercise at index ${index}: ${issues}`);
    }

    return result.data;
  });
}

function ensureUniqueSourceIDs(exercises: ExerciseImportInput[]): void {
  const sourceIDs = new Set<string>();

  for (const exercise of exercises) {
    if (sourceIDs.has(exercise.id)) {
      throw new Error(`Duplicate sourceID: ${exercise.id}`);
    }

    sourceIDs.add(exercise.id);
  }
}

async function importExercises(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');

  const dataDirectory = getDataDirectory();

  const exercises = await readExercises(dataDirectory);

  ensureUniqueSourceIDs(exercises);

  console.log(`Validated ${exercises.length} exercises`);

  if (dryRun) {
    console.log('Dry run complete. No database writes performed.');

    return;
  }

  const connection = await dbConnect(config.mongoUri);

  if (!connection) {
    throw new Error('Unable to connect to MongoDB');
  }

  try {
    const operations = exercises.map((exercise) => ({
      updateOne: {
        filter: {
          source: EXERCISE_SOURCE,

          sourceID: exercise.id,
        },

        update: {
          $set: {
            source: EXERCISE_SOURCE,

            sourceID: exercise.id,

            name: exercise.name,

            muscleGroup: exercise.target,

            bodyPart: exercise.bodyPart,

            equipment: exercise.equipment,

            secondaryMuscles: exercise.secondaryMuscles,

            instructions: exercise.instructions,

            description: exercise.description,

            difficulty: exercise.difficulty,

            category: exercise.category,

            isArchived: false,
          },
        },

        upsert: true,
      },
    }));

    const result = await Exercise.bulkWrite(operations, {
      ordered: false,
    });

    console.log('Exercise import complete', {
      matched: result.matchedCount,

      modified: result.modifiedCount,

      inserted: result.upsertedCount,
    });
  } finally {
    await connection.disconnect();
  }
}

void importExercises().catch((error: unknown) => {
  console.error(
    'Exercise import failed:',
    error instanceof Error ? error.message : error,
  );

  process.exitCode = 1;
});

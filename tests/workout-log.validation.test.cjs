require('ts-node/register/transpile-only');
const assert = require('node:assert/strict');
const test = require('node:test');
const { Types } = require('mongoose');
const { createWorkoutLogSchema } = require('../src/schemas/workout-log.schema');
const WorkoutLog = require('../src/models/workout-log.model').default;

const validInput = {
  workoutDate: '2026-10-26',
  exerciseId: new Types.ObjectId().toString(),
  sets: [{ reps: 8 }],
};

// Validation runs in memory; these tests never connect to MongoDB.
async function validateModel(input) {
  await new WorkoutLog({ userId: new Types.ObjectId(), ...input }).validate();
}

test('calendar date becomes a Date and optional weight stays omitted', async () => {
  for (const weight of [undefined, 0, 12.5]) {
    const set = { reps: 8 };
    if (weight !== undefined) set.weight = weight;
    const parsed = createWorkoutLogSchema.parse({ ...validInput, sets: [set] });
    assert.equal(parsed.workoutDate.toISOString(), '2026-10-26T00:00:00.000Z');
    assert.equal(Object.hasOwn(parsed.sets[0], 'weight'), weight !== undefined);
    assert.equal(parsed.sets[0].weight, weight);
    await assert.doesNotReject(() => validateModel(parsed));
  }
});

test('request validation rejects invalid dates, IDs, sets and client ownership', () => {
  for (const change of [
    { workoutDate: undefined },
    { workoutDate: null },
    { workoutDate: '2026-02-30' },
    { workoutDate: 'not-a-date' },
    { workoutDate: '10/26/2026' },
    { exerciseId: 'invalid' },
    { sets: undefined },
    { sets: [] },
    { sets: [{ reps: 1.5 }] },
    { sets: [{ reps: 0 }] },
    { sets: [{ reps: 8, weight: -1 }] },
    { sets: [{ reps: 8, weight: Infinity }] },
    { sets: [{ reps: 8, weight: null }] },
    { sets: [{ reps: '8' }] },
    { sets: [{ reps: 8, weight: '' }] },
    { _id: new Types.ObjectId().toString() },
    { userId: new Types.ObjectId().toString() },
  ]) {
    assert.equal(
      createWorkoutLogSchema.safeParse({ ...validInput, ...change }).success,
      false,
    );
  }
});

test('model independently rejects missing fields and invalid sets', async () => {
  const parsed = createWorkoutLogSchema.parse(validInput);
  for (const change of [
    { userId: undefined },
    { exerciseId: undefined },
    { workoutDate: undefined },
    { sets: undefined },
    { sets: [] },
    { sets: [{ reps: 1.5 }] },
    { sets: [{ reps: 0 }] },
    { sets: [{ weight: 10 }] },
    { sets: [{ reps: 8, weight: -1 }] },
    { sets: [{ reps: 8, weight: Infinity }] },
  ]) {
    await assert.rejects(() => validateModel({ ...parsed, ...change }));
  }
});

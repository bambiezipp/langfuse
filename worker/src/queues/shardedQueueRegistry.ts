import { Queue } from "bullmq";

import {
  QueueName,
  getQueue,
  getExistingQueue,
  IngestionQueue,
  SecondaryIngestionQueue,
  OtelIngestionQueue,
  TraceUpsertQueue,
  EvalExecutionQueue,
  SecondaryEvalExecutionQueue,
  LLMAsJudgeExecutionQueue,
} from "@langfuse/shared/src/server";

export type ShardedQueueDef = {
  baseQueueName: QueueName;
  getShardNames: () => string[];
  getInstance: (shardName: string) => Queue | null;
  getExistingInstance: (shardName: string) => Queue | null;
};

export const SHARDED_QUEUES: ShardedQueueDef[] = [
  {
    baseQueueName: QueueName.IngestionQueue,
    getShardNames: () => IngestionQueue.getShardNames(),
    getInstance: (shard) => IngestionQueue.getInstance({ shardName: shard }),
    getExistingInstance: (shard) => IngestionQueue.getExistingInstance(shard),
  },
  {
    baseQueueName: QueueName.IngestionSecondaryQueue,
    getShardNames: () => SecondaryIngestionQueue.getShardNames(),
    getInstance: (shard) =>
      SecondaryIngestionQueue.getInstance({ shardName: shard }),
    getExistingInstance: (shard) =>
      SecondaryIngestionQueue.getExistingInstance(shard),
  },
  {
    baseQueueName: QueueName.OtelIngestionQueue,
    getShardNames: () => OtelIngestionQueue.getShardNames(),
    getInstance: (shard) =>
      OtelIngestionQueue.getInstance({ shardName: shard }),
    getExistingInstance: (shard) =>
      OtelIngestionQueue.getExistingInstance(shard),
  },
  {
    baseQueueName: QueueName.TraceUpsert,
    getShardNames: () => TraceUpsertQueue.getShardNames(),
    getInstance: (shard) => TraceUpsertQueue.getInstance({ shardName: shard }),
    getExistingInstance: (shard) => TraceUpsertQueue.getExistingInstance(shard),
  },
  {
    baseQueueName: QueueName.EvaluationExecution,
    getShardNames: () => EvalExecutionQueue.getShardNames(),
    getInstance: (shard) =>
      EvalExecutionQueue.getInstance({ shardName: shard }),
    getExistingInstance: (shard) =>
      EvalExecutionQueue.getExistingInstance(shard),
  },
  {
    baseQueueName: QueueName.EvaluationExecutionSecondaryQueue,
    getShardNames: () => SecondaryEvalExecutionQueue.getShardNames(),
    getInstance: (shard) =>
      SecondaryEvalExecutionQueue.getInstance({ shardName: shard }),
    getExistingInstance: (shard) =>
      SecondaryEvalExecutionQueue.getExistingInstance(shard),
  },
  {
    baseQueueName: QueueName.LLMAsJudgeExecution,
    getShardNames: () => LLMAsJudgeExecutionQueue.getShardNames(),
    getInstance: (shard) =>
      LLMAsJudgeExecutionQueue.getInstance({ shardName: shard }),
    getExistingInstance: (shard) =>
      LLMAsJudgeExecutionQueue.getExistingInstance(shard),
  },
];

export const SHARDED_QUEUE_BASE_NAMES = new Set<QueueName>(
  SHARDED_QUEUES.map((q) => q.baseQueueName),
);

/**
 * Resolve a queue name (possibly a shard name like "ingestion-queue-1") to its
 * BullMQ Queue instance. Checks sharded queues first, then falls back to
 * non-sharded getQueue(). Creates the instance if it doesn't exist.
 */
export function resolveQueueInstance(queueName: string): Queue | null {
  for (const def of SHARDED_QUEUES) {
    if (queueName.startsWith(def.baseQueueName)) {
      return def.getInstance(queueName);
    }
  }

  return getQueue(
    queueName as Exclude<
      QueueName,
      | QueueName.IngestionQueue
      | QueueName.IngestionSecondaryQueue
      | QueueName.EvaluationExecution
      | QueueName.EvaluationExecutionSecondaryQueue
      | QueueName.LLMAsJudgeExecution
      | QueueName.TraceUpsert
      | QueueName.OtelIngestionQueue
    >,
  );
}

/**
 * Like resolveQueueInstance but only returns already-initialized instances.
 * Never creates Redis connections or triggers side effects.
 */
export function resolveExistingQueueInstance(queueName: string): Queue | null {
  for (const def of SHARDED_QUEUES) {
    if (queueName.startsWith(def.baseQueueName)) {
      return def.getExistingInstance(queueName);
    }
  }

  return getExistingQueue(
    queueName as Exclude<
      QueueName,
      | QueueName.IngestionQueue
      | QueueName.IngestionSecondaryQueue
      | QueueName.EvaluationExecution
      | QueueName.EvaluationExecutionSecondaryQueue
      | QueueName.LLMAsJudgeExecution
      | QueueName.TraceUpsert
      | QueueName.OtelIngestionQueue
    >,
  );
}

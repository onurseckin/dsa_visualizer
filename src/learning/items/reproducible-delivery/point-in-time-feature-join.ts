import {
  defineTraceItem,
  functionExecution,
  matrixSteps,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const code = `def point_in_time_join(record):
    joined = []
    for label in record["labels"]:
        eligible = [
            feature
            for feature in record["features"]
            if feature["entity_id"] == label["entity_id"]
            and feature["event_time"] <= label["event_time"]
            and feature["created_at"] <= label["observed_at"]
        ]
        selected = max(
            eligible,
            key=lambda feature: (feature["event_time"], feature["created_at"]),
            default=None,
        )
        joined.append(
            {
                "entity_id": label["entity_id"],
                "label_time": label["event_time"],
                "feature_value": None if selected is None else selected["value"],
                "feature_time": None if selected is None else selected["event_time"],
            }
        )
    return joined`;

const execution = functionExecution({
  entrypoint: "point_in_time_join",
  outputContract:
    "For each label in input order, return entity_id, label_time, and the latest same-entity feature value whose event_time and created_at were both observable at that label snapshot.",
  cases: [
    {
      id: "exclude-future-feature",
      label: "Future feature value must not leak into a historical label",
      input: {
        labels: [
          {
            entity_id: "acct-7",
            event_time: "2026-07-10T10:00:00Z",
            observed_at: "2026-07-10T10:05:00Z",
          },
        ],
        features: [
          {
            entity_id: "acct-7",
            event_time: "2026-07-10T09:40:00Z",
            created_at: "2026-07-10T09:41:00Z",
            value: 4,
          },
          {
            entity_id: "acct-7",
            event_time: "2026-07-10T10:20:00Z",
            created_at: "2026-07-10T10:21:00Z",
            value: 99,
          },
        ],
      },
      expected: [
        {
          entity_id: "acct-7",
          label_time: "2026-07-10T10:00:00Z",
          feature_value: 4,
          feature_time: "2026-07-10T09:40:00Z",
        },
      ],
      comparison: "deep-equal",
    },
    {
      id: "entity-isolation",
      label: "Entity keys and label times select independent histories",
      input: {
        labels: [
          {
            entity_id: "acct-1",
            event_time: "2026-06-01T12:00:00Z",
            observed_at: "2026-06-01T12:03:00Z",
          },
          {
            entity_id: "acct-2",
            event_time: "2026-06-01T12:00:00Z",
            observed_at: "2026-06-01T12:03:00Z",
          },
        ],
        features: [
          {
            entity_id: "acct-1",
            event_time: "2026-06-01T11:55:00Z",
            created_at: "2026-06-01T11:56:00Z",
            value: 11,
          },
          {
            entity_id: "acct-2",
            event_time: "2026-06-01T11:50:00Z",
            created_at: "2026-06-01T11:51:00Z",
            value: 22,
          },
          {
            entity_id: "acct-2",
            event_time: "2026-06-01T12:10:00Z",
            created_at: "2026-06-01T12:11:00Z",
            value: 222,
          },
        ],
      },
      expected: [
        {
          entity_id: "acct-1",
          label_time: "2026-06-01T12:00:00Z",
          feature_value: 11,
          feature_time: "2026-06-01T11:55:00Z",
        },
        {
          entity_id: "acct-2",
          label_time: "2026-06-01T12:00:00Z",
          feature_value: 22,
          feature_time: "2026-06-01T11:50:00Z",
        },
      ],
      comparison: "deep-equal",
    },
    {
      id: "exclude-late-arrival",
      label: "Backfilled historical feature was unavailable at observation time",
      input: {
        labels: [
          {
            entity_id: "acct-9",
            event_time: "2026-05-05T08:00:00Z",
            observed_at: "2026-05-05T08:02:00Z",
          },
        ],
        features: [
          {
            entity_id: "acct-9",
            event_time: "2026-05-05T07:30:00Z",
            created_at: "2026-05-05T07:31:00Z",
            value: 3,
          },
          {
            entity_id: "acct-9",
            event_time: "2026-05-05T07:50:00Z",
            created_at: "2026-05-06T09:00:00Z",
            value: 8,
          },
        ],
      },
      expected: [
        {
          entity_id: "acct-9",
          label_time: "2026-05-05T08:00:00Z",
          feature_value: 3,
          feature_time: "2026-05-05T07:30:00Z",
        },
      ],
      comparison: "deep-equal",
    },
  ],
});

const starterCode = semanticStarter({
  entrypoint: "point_in_time_join",
  parameters: ["record"],
  contract:
    "For each label, select the latest same-entity feature whose event time and creation time were both observable at the historical label snapshot.",
});

function generateSteps(input: unknown) {
  const record = input as {
    labels?: readonly {
      entity_id: string;
      event_time: string;
      observed_at: string;
    }[];
    features?: readonly {
      entity_id: string;
      event_time: string;
      created_at: string;
      value: unknown;
    }[];
  };
  const label = record?.labels?.[0];
  const features = record?.features ?? [];
  const phaseRows = features.map((feature) => [
    feature.entity_id,
    feature.event_time,
    feature.created_at,
    String(feature.value),
    "unchecked",
  ]);
  const eligibleRows = features.map((feature) => {
    const sameEntity = feature.entity_id === label?.entity_id;
    const eventEligible = Boolean(label && feature.event_time <= label.event_time);
    const available = Boolean(label && feature.created_at <= label.observed_at);
    return [
      feature.entity_id,
      feature.event_time,
      feature.created_at,
      String(feature.value),
      !sameEntity
        ? "other entity"
        : !eventEligible
          ? "future"
          : !available
            ? "late arrival"
            : "eligible",
    ];
  });
  const selectedIndex = eligibleRows.reduce(
    (best, row, index) =>
      row[4] === "eligible" && (best < 0 || String(row[1]) > String(eligibleRows[best]?.[1]))
        ? index
        : best,
    -1,
  );
  return matrixSteps([
    {
      codeLine: 3,
      what: "Anchor the join on one entity and historical label timestamp.",
      why: "The label snapshot defines what evidence was knowable for that example.",
      values: phaseRows,
      colHeaders: ["entity", "event time", "created at", "value", "status"],
      activeCells: phaseRows.length ? [[0, 0]] : [],
      variables: {
        entity: label?.entity_id ?? "missing",
        labelTime: label?.event_time ?? "missing",
      },
    },
    {
      codeLine: 5,
      what: "Reject other entities, future events, and late-arriving backfills.",
      why: "Event time alone is insufficient when a historical value was created after the label snapshot.",
      values: eligibleRows,
      colHeaders: ["entity", "event time", "created at", "value", "status"],
      activeCells: eligibleRows.flatMap((row, index) =>
        row[4] === "eligible" ? [[index, 4] as const] : [],
      ),
    },
    {
      codeLine: 11,
      what: "Select the latest point-in-time-eligible value.",
      why: "The newest observable value preserves recency without importing future information.",
      values: eligibleRows.map((row, index) => [
        ...row.slice(0, 4),
        index === selectedIndex ? "selected" : row[4],
      ]),
      colHeaders: ["entity", "event time", "created at", "value", "status"],
      activeCells: selectedIndex >= 0 ? [[selectedIndex, 4]] : [],
    },
  ]);
}

export const pointInTimeFeatureJoin = defineTraceItem({
  id: "point-in-time-feature-join",
  title: "Point-in-time feature join",
  topicIds: ["ml_feature_pipelines"],
  difficultyProfile: profile(2, 3, 3, 2),
  description:
    "Join timestamped labels to the latest same-entity feature value that existed at the historical observation boundary.",
  objective:
    "Distinguish event time from availability time and prevent future or late-arriving feature leakage.",
  completionEvidence:
    "The learner predicts the selected feature for changed timestamp histories and the implementation passes future, entity-isolation, and late-arrival cases.",
  sources: [
    verifiedSource({
      label: "Feast architecture",
      url: "https://docs.feast.dev/getting-started/architecture/overview",
    }),
  ],
  code,
  starterCode,
  execution,
  generateSteps,
  assessmentPayload: {
    variant: "changed-event-history",
    changedContext: true,
    isomorphicRetest: true,
    prompt: "Predict which feature record is legal for the historical label snapshot.",
    currentState: "Timestamped labels and feature rows are aligned by entity.",
    referenceNextState: "Only event-time and availability-time eligible rows remain.",
  },
});

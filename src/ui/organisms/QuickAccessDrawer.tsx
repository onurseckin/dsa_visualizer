import { useEffect, useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import type { TopicId, SourceKind } from "../../types/dsa";
import { getAllLearningItems } from "../../learning/registry";
import { getLearningItemTopics, isMlInfraLearningItem } from "../../app/topics";
import {
  Badge,
  Button,
  Collapsible,
  Input,
  difficultyBadgeVariant,
  IconButton,
  SourceBadgeList,
} from "../index";
import { Dialog } from "@base-ui-components/react/dialog";

import { TOPICS } from "../../app/topics";

export const ALL_TOPICS: readonly { id: TopicId; label: string }[] = TOPICS;

export interface QuickAccessDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAlgorithm: (algorithmId: string) => void;
  activeAlgorithmId?: string;
  topics?: readonly { id: TopicId; label: string }[];
}

export function QuickAccessDrawer({
  isOpen,
  onClose,
  onSelectAlgorithm,
  activeAlgorithmId,
  topics = ALL_TOPICS,
}: QuickAccessDrawerProps): React.ReactElement {
  const allItems = useMemo(() => getAllLearningItems(), []);
  const itemMap = useMemo(() => new Map(allItems.map((item) => [item.id, item])), [allItems]);

  const activeTopicIds = useMemo(
    () => (activeAlgorithmId !== undefined ? itemMap.get(activeAlgorithmId)?.topicIds : undefined),
    [itemMap, activeAlgorithmId],
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"all" | SourceKind>("all");

  const [openMap, setOpenMap] = useState<Partial<Record<TopicId, boolean>>>(() =>
    Object.fromEntries((activeTopicIds ?? []).map((topicId) => [topicId, true])),
  );

  useEffect(() => {
    if (!isOpen) return;
    setSearchQuery("");
    setSourceFilter("all");
    setOpenMap(Object.fromEntries((activeTopicIds ?? []).map((topicId) => [topicId, true])));
  }, [isOpen, activeTopicIds]);

  const query = searchQuery.trim().toLowerCase();
  const isFiltering = query.length > 0 || sourceFilter !== "all";

  const topicIdSet = useMemo(() => new Set(topics.map((topic) => topic.id)), [topics]);
  const totalItems = useMemo(
    () =>
      allItems.filter((item) =>
        getLearningItemTopics(item).some((topicId) => topicIdSet.has(topicId)),
      ).length,
    [allItems, topicIdSet],
  );

  const groups = useMemo(() => {
    return topics
      .map((topic) => {
        const topicItems = allItems.filter((item) =>
          getLearningItemTopics(item).includes(topic.id),
        );
        const matches = topicItems.filter((item) => {
          if (sourceFilter !== "all") {
            const matchesSource = item.sources.some((source) => source.kind === sourceFilter);
            const isMl = sourceFilter === "ml_infra" && isMlInfraLearningItem(item);
            if (!matchesSource && !isMl) {
              return false;
            }
          }

          if (query.length === 0) return true;

          if (
            item.title.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query) ||
            topic.label.toLowerCase().includes(query) ||
            item.difficulty.toLowerCase().includes(query)
          ) {
            return true;
          }

          return item.sources.some((source) => {
            const kind = source.kind;
            if (kind === "leetcode") {
              const id = (source.id ?? source.leetcodeId)?.toString() ?? "";
              return (
                id.includes(query) ||
                source.label.toLowerCase().includes(query) ||
                "leetcode".includes(query) ||
                `lc #${id}`.includes(query)
              );
            }
            if (kind === "book") {
              const bookTitle = (source.bookTitle ?? "").toLowerCase();
              const chapter = (source.chapter ?? "").toString().toLowerCase();
              return (
                bookTitle.includes(query) ||
                chapter.includes(query) ||
                source.label.toLowerCase().includes(query) ||
                "cph".includes(query) ||
                `chapter ${chapter}`.includes(query)
              );
            }
            if (kind === "standard") {
              return source.label.toLowerCase().includes(query);
            }
            if (kind === "ml_infra") {
              return "ml infra".includes(query) || "ml_infra".includes(query);
            }
            return false;
          });
        });
        return { topic, algorithms: matches, totalCount: topicItems.length };
      })
      .filter((group) => !isFiltering || group.algorithms.length > 0);
  }, [topics, allItems, isFiltering, query, sourceFilter]);

  const handleSelect = (algorithmId: string) => {
    onSelectAlgorithm(algorithmId);
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="ui-drawer-backdrop" />
        <Dialog.Popup
          className="ui-drawer ui-drawer--right w-[35vw] min-w-[320px]"
          style={{ width: "35vw", minWidth: "320px" }}
        >
          <div className="ui-drawer__header">
            <Dialog.Title className="ui-drawer__title">Algorithms</Dialog.Title>
            <Dialog.Close
              render={<IconButton icon={<X />} aria-label="Close" variant="ghost" size="sm" />}
            />
          </div>
          <div className="ui-drawer__body p-6 md:p-8">
            <div className="flex flex-col gap-3">
              <p className="m-0 text-sm text-[var(--text-muted)]">
                {totalItems} algorithms across {topics.length} topics
              </p>

              <Input
                autoFocus
                leadingIcon={<Search />}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onClear={() => setSearchQuery("")}
                placeholder="Search algorithms…"
                aria-label="Search algorithms"
              />

              <div className="flex items-center gap-1.5 flex-wrap my-1">
                <Button
                  size="sm"
                  variant={sourceFilter === "all" ? "primary" : "ghost"}
                  onClick={() => setSourceFilter("all")}
                >
                  All Sources
                </Button>
                <Button
                  size="sm"
                  variant={sourceFilter === "leetcode" ? "primary" : "ghost"}
                  onClick={() => setSourceFilter("leetcode")}
                >
                  LeetCode
                </Button>
                <Button
                  size="sm"
                  variant={sourceFilter === "book" ? "primary" : "ghost"}
                  onClick={() => setSourceFilter("book")}
                >
                  Book
                </Button>
                <Button
                  size="sm"
                  variant={sourceFilter === "standard" ? "primary" : "ghost"}
                  onClick={() => setSourceFilter("standard")}
                >
                  Standard
                </Button>
                <Button
                  size="sm"
                  variant={sourceFilter === "ml_infra" ? "primary" : "ghost"}
                  onClick={() => setSourceFilter("ml_infra")}
                >
                  ML Infra
                </Button>
              </div>

              {groups.length === 0 ? (
                <p className="m-0 py-6 px-2 text-center text-sm text-[var(--text-muted)]">
                  No algorithms match{" "}
                  {searchQuery.trim() ? `“${searchQuery.trim()}”` : "the selected source filter"}
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {groups.map((group) => (
                    <Collapsible
                      key={group.topic.id}
                      className="border border-[var(--border-subtle)] rounded-[var(--radius-md)] overflow-hidden shadow-sm"
                      title={group.topic.label}
                      meta={
                        <Badge size="sm" variant="neutral">
                          {isFiltering ? group.algorithms.length : group.totalCount}
                        </Badge>
                      }
                      open={isFiltering ? true : openMap[group.topic.id] === true}
                      onOpenChange={(open) => {
                        if (isFiltering) return;
                        setOpenMap((prev) => ({ ...prev, [group.topic.id]: open }));
                      }}
                      contentClassName="!p-0"
                    >
                      <div className="flex flex-col p-1.5 gap-1 bg-[var(--bg-inset)]">
                        {group.algorithms.map((alg) => {
                          const isActive = alg.id === activeAlgorithmId;
                          return (
                            <Button
                              key={alg.id}
                              selected={isActive}
                              variant={isActive ? "primary" : "ghost"}
                              size="sm"
                              fullWidth
                              icon={
                                isActive ? <Check className="w-3.5 h-3.5 shrink-0" /> : undefined
                              }
                              onClick={() => handleSelect(alg.id)}
                              className="justify-start text-left font-normal"
                            >
                              <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-left">
                                {alg.title}
                              </span>
                              <SourceBadgeList sources={alg.sources} size="sm" />
                              <Badge size="sm" variant={difficultyBadgeVariant(alg.difficulty)}>
                                {alg.difficulty}
                              </Badge>
                            </Button>
                          );
                        })}
                      </div>
                    </Collapsible>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default QuickAccessDrawer;

"use client";

import dynamic from "next/dynamic";
import PageLoading from "./PageLoading";
import type { ComponentProps } from "react";

const TaskBoard = dynamic(() => import("./TaskBoard"), {
  ssr: false,
  loading: () => <PageLoading messageKey="loadingTasks" />,
});

type Props = ComponentProps<typeof TaskBoard>;

export default function TaskBoardClient(props: Props) {
  return <TaskBoard {...props} />;
}

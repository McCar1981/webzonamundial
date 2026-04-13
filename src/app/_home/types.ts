import { ReactNode } from "react";

export type ModuleItem = {
  key: string;
  icon: ReactNode;
  color: string;
  title: string;
  desc: string;
  href?: string;
};

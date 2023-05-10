import React from "react";
import { string } from "prop-types";
import Octicon, {
  Comment,
  Check,
  RepoForked,
  Eye,
  Checklist,
  CloudUpload,
  Globe,
  Hubot,
  Milestone,
  Project,
  Stop,
  Note,
  RepoPush,
  Package,
  GitPullRequest,
  Bookmark,
  IssueOpened,
  IssueClosed,
} from "@primer/octicons-react";

const iconMap = {
  push: RepoPush,
  pull_request: GitPullRequest,
  label: Bookmark,
  "issues.opened": IssueOpened,
  "issues.closed": IssueClosed,
  issue_comment: Comment,
  status: Check,
  fork: RepoForked,
  watch: Eye,
  check_run: Checklist,
  check_suite: Checklist,
  deployment: CloudUpload,
  deployment_status: CloudUpload,
  ping: Globe,
  installation: Hubot,
  installation_repositories: Hubot,
  milestone: Milestone,
  project: Project,
  project_card: Note,
  project_column: Project,
  repository_vulnerability_alert: Stop,
};

export default function EventIcon({ action, event }) {
  let icon;
  if (action && iconMap[`${event}.${action}`]) {
    icon = iconMap[`${event}.${action}`];
  } else if (iconMap[event]) {
    icon = iconMap[event];
  } else {
    icon = Package;
  }

  return <Octicon icon={icon} />;
}

EventIcon.propTypes = {
  action: string,
  event: string,
};

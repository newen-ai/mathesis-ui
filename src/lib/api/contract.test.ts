/**
 * Contract tests: every API helper must call the backend route it targets (method, path, body).
 * If a backend route is renamed, update both sides together (see "Backend/UI Compatibility" in AGENTS.md).
 */
import { describe, expect, it } from "vitest";
import { mockFetch } from "@/test/fetch-mock";
import * as admin from "./admin";
import * as ateneo from "./ateneo";
import * as block from "./block";
import * as chat from "./chat";
import * as enterprise from "./enterprise";
import * as feed from "./feed";
import * as notifications from "./notifications";
import * as profile from "./profile";
import * as report from "./report";
import * as verbum from "./verbum";

// Ids with reserved characters prove every path segment is URL-encoded.
const G = "g/1";
const T = "t 2";
const C = "c?3";
const U = "u#4";
const eG = encodeURIComponent(G);
const eT = encodeURIComponent(T);
const eC = encodeURIComponent(C);
const eU = encodeURIComponent(U);

type ContractCase = [name: string, call: () => Promise<unknown>, method: string, path: string, body?: unknown];

const dataEnvelope = { status: 200, body: { success: true, message: "OK", data: { items: [], enterprises: [], bugReports: [] } } };

const cases: ContractCase[] = [
  // Ateneo
  ["listAteneoGroups", () => ateneo.listAteneoGroups("discover", 10), "GET", "/ateneo/groups?tab=discover&limit=10"],
  ["createAteneoGroup", () => ateneo.createAteneoGroup({ name: "Lógica", icon: "community" }), "POST", "/ateneo/groups", { name: "Lógica", icon: "community" }],
  ["getAteneoGroup", () => ateneo.getAteneoGroup(G), "GET", `/ateneo/groups/${eG}`],
  ["listAteneoGroupMembers", () => ateneo.listAteneoGroupMembers(G), "GET", `/ateneo/groups/${eG}/members`],
  ["listAteneoGroupExpulsions", () => ateneo.listAteneoGroupExpulsions(G), "GET", `/ateneo/groups/${eG}/expulsions`],
  ["listAteneoRemovedContent", () => ateneo.listAteneoRemovedContent(G), "GET", `/ateneo/groups/${eG}/moderation/removed-content`],
  [
    "kickAteneoGroupMember",
    () => ateneo.kickAteneoGroupMember(G, U, { sourceContext: "MEMBERS_LIST", reason: "spam" } as Parameters<typeof ateneo.kickAteneoGroupMember>[2]),
    "POST",
    `/ateneo/groups/${eG}/members/${eU}/kick`,
    { sourceContext: "MEMBERS_LIST", reason: "spam" },
  ],
  ["restoreAteneoGroupMember", () => ateneo.restoreAteneoGroupMember(G, U), "POST", `/ateneo/groups/${eG}/members/${eU}/restore`],
  [
    "updateAteneoGroup",
    () => ateneo.updateAteneoGroup(G, { name: "Nuevo", icon: "community" } as Parameters<typeof ateneo.updateAteneoGroup>[1]),
    "PATCH",
    `/ateneo/groups/${eG}`,
    { name: "Nuevo", icon: "community" },
  ],
  ["joinAteneoGroup", () => ateneo.joinAteneoGroup(G), "POST", `/ateneo/groups/${eG}/join`],
  ["leaveAteneoGroup", () => ateneo.leaveAteneoGroup(G), "POST", `/ateneo/groups/${eG}/leave`],
  ["listAteneoFeed", () => ateneo.listAteneoFeed(5), "GET", "/ateneo/feed?limit=5"],
  ["listAteneoTopics", () => ateneo.listAteneoTopics(G, 7), "GET", `/ateneo/groups/${eG}/topics?limit=7`],
  ["getAteneoTopic", () => ateneo.getAteneoTopic(G, T), "GET", `/ateneo/groups/${eG}/topics/${eT}`],
  ["getAteneoRemovedTopicPreview", () => ateneo.getAteneoRemovedTopicPreview(G, T), "GET", `/ateneo/groups/${eG}/topics/${eT}/moderation/preview`],
  ["deleteAteneoTopic", () => ateneo.deleteAteneoTopic(G, T), "DELETE", `/ateneo/groups/${eG}/topics/${eT}`],
  ["moderateRemoveAteneoTopic", () => ateneo.moderateRemoveAteneoTopic(G, T, { reason: "x" }), "POST", `/ateneo/groups/${eG}/topics/${eT}/moderation/remove`, { reason: "x" }],
  ["moderateRestoreAteneoTopic", () => ateneo.moderateRestoreAteneoTopic(G, T, { reason: "y" }), "POST", `/ateneo/groups/${eG}/topics/${eT}/moderation/restore`, { reason: "y" }],
  ["listAteneoTopicComments", () => ateneo.listAteneoTopicComments(G, T), "GET", `/ateneo/groups/${eG}/topics/${eT}/comments`],
  [
    "createAteneoTopicComment",
    () => ateneo.createAteneoTopicComment(G, T, { content: "Hola", parentCommentId: C }),
    "POST",
    `/ateneo/groups/${eG}/topics/${eT}/comments`,
    { content: "Hola", parentCommentId: C },
  ],
  ["moderateRemoveAteneoComment", () => ateneo.moderateRemoveAteneoComment(G, T, C, {}), "POST", `/ateneo/groups/${eG}/topics/${eT}/comments/${eC}/moderation/remove`, {}],
  ["moderateRestoreAteneoComment", () => ateneo.moderateRestoreAteneoComment(G, T, C, {}), "POST", `/ateneo/groups/${eG}/topics/${eT}/comments/${eC}/moderation/restore`, {}],
  ["toggleAteneoTopicReaction", () => ateneo.toggleAteneoTopicReaction(G, T), "POST", `/ateneo/groups/${eG}/topics/${eT}/reactions`, { reactionValue: "value" }],
  ["toggleAteneoCommentReaction", () => ateneo.toggleAteneoCommentReaction(G, T, C), "POST", `/ateneo/groups/${eG}/topics/${eT}/comments/${eC}/reactions`, { reactionValue: "value" }],
  // Chat
  ["listMyChats", () => chat.listMyChats(15), "GET", "/chats?limit=15"],
  ["getChatById", () => chat.getChatById(C), "GET", `/chats/${eC}`],
  ["createDirectChat", () => chat.createDirectChat(U), "POST", "/chats/direct", { targetUserId: U }],
  ["createGroupChat", () => chat.createGroupChat("Grupo", [U]), "POST", "/chats/groups", { title: "Grupo", userIds: [U] }],
  ["readChatMessages", () => chat.readChatMessages(C, { limit: 20, cursor: "cur" }), "GET", `/chats/${eC}/messages?limit=20&cursor=cur`],
  ["readChatMessages without options", () => chat.readChatMessages(C), "GET", `/chats/${eC}/messages?`],
  ["sendChatMessage", () => chat.sendChatMessage(C, "Hola"), "POST", `/chats/${eC}/messages`, { content: "Hola" }],
  ["markChatAsRead", () => chat.markChatAsRead(C), "POST", `/chats/${eC}/read`],
  // Feed
  ["listFeedPosts defaults", () => feed.listFeedPosts(), "GET", "/feed?limit=20&sortBy=HOT"],
  ["listFeedPosts with gravity", () => feed.listFeedPosts({ limit: 5, sortBy: "NEWEST", gravity: 1.5 }), "GET", "/feed?limit=5&sortBy=NEWEST&gravity=1.5"],
  ["deleteFeedPost", () => feed.deleteFeedPost(T), "DELETE", `/feed/${eT}`],
  ["toggleFeedPostReaction", () => feed.toggleFeedPostReaction(T), "POST", `/feed/${eT}/reactions`, { reactionValue: "value" }],
  // Notifications
  ["listNotifications", () => notifications.listNotifications(25), "GET", "/notifications?limit=25"],
  ["markNotificationAsRead", () => notifications.markNotificationAsRead(C), "POST", `/notifications/${eC}/read`],
  ["markAllNotificationsAsRead", () => notifications.markAllNotificationsAsRead(), "POST", "/notifications/read-all"],
  // Blocks
  ["listMyBlockedUsers", () => block.listMyBlockedUsers(), "GET", "/blocks/me"],
  ["blockUser with note", () => block.blockUser(U, "molesto"), "POST", `/blocks/${eU}`, { reasonNote: "molesto" }],
  ["blockUser without note", () => block.blockUser(U), "POST", `/blocks/${eU}`, {}],
  ["unblockUser", () => block.unblockUser(U), "DELETE", `/blocks/${eU}`],
  // Content reports
  [
    "createContentReport with details",
    () => report.createContentReport({ targetType: "ATENEO_COMMENT", targetId: C, reason: "OTHER", details: "  insulta  " }),
    "POST",
    "/reports",
    { targetType: "ATENEO_COMMENT", targetId: C, reason: "OTHER", details: "insulta" }
  ],
  [
    "createContentReport without details",
    () => report.createContentReport({ targetType: "PROFILE", targetId: U, reason: "SPAM", details: "   " }),
    "POST",
    "/reports",
    { targetType: "PROFILE", targetId: U, reason: "SPAM" }
  ],
  // Enterprises
  ["listMyEnterprises", () => enterprise.listMyEnterprises(), "GET", "/enterprises/my"],
  ["listVerifiedDirectory", () => enterprise.listVerifiedDirectory(), "GET", "/enterprises/directory"],
  [
    "createEnterprise",
    () => enterprise.createEnterprise({ companyName: "Acme", role: "CEO", website: "https://a.b", description: "d" }),
    "POST",
    "/enterprises",
    { companyName: "Acme", role: "CEO", website: "https://a.b", description: "d" },
  ],
  ["updateEnterprise", () => enterprise.updateEnterprise("e1", { companyName: "Acme", role: "CTO" }), "PATCH", "/enterprises/e1", { companyName: "Acme", role: "CTO" }],
  ["deleteEnterprise", () => enterprise.deleteEnterprise("e1"), "DELETE", "/enterprises/e1"],
  // Platform admin (whitelist) and companies dashboard
  ["getWhitelistedEmails", () => admin.getWhitelistedEmails(), "GET", "/admin/whitelist/emails"],
  ["getWhitelistUsers", () => admin.getWhitelistUsers("non-whitelisted"), "GET", "/admin/whitelist/users?status=non-whitelisted"],
  ["getWhitelistRequests", () => admin.getWhitelistRequests(), "GET", "/admin/whitelist/requests?status=PENDING"],
  ["approveWhitelistRequest with reason", () => admin.approveWhitelistRequest("r/1", "ok"), "POST", `/admin/whitelist/requests/${encodeURIComponent("r/1")}/approve`, { reason: "ok" }],
  ["approveWhitelistRequest without reason", () => admin.approveWhitelistRequest("r1"), "POST", "/admin/whitelist/requests/r1/approve", {}],
  ["checkCompaniesAdminAccess", () => admin.checkCompaniesAdminAccess(), "GET", "/admin/companies/access-check"],
  ["createCompaniesMembershipRequest", () => admin.createCompaniesMembershipRequest("hola"), "POST", "/admin/companies/my-request", { message: "hola" }],
  ["createCompaniesMembershipRequest empty", () => admin.createCompaniesMembershipRequest(), "POST", "/admin/companies/my-request", {}],
  ["cancelCompaniesMembershipRequest", () => admin.cancelCompaniesMembershipRequest(), "DELETE", "/admin/companies/my-request"],
  ["getCompaniesBadgeRequests", () => admin.getCompaniesBadgeRequests("ALL"), "GET", "/admin/companies/badge-requests?status=ALL"],
  ["approveCompaniesBadgeRequest", () => admin.approveCompaniesBadgeRequest("r1"), "POST", "/admin/companies/badge-requests/r1/approve"],
  ["rejectCompaniesBadgeRequest", () => admin.rejectCompaniesBadgeRequest("r1"), "POST", "/admin/companies/badge-requests/r1/reject"],
  ["getCompaniesMembers", () => admin.getCompaniesMembers(), "GET", "/admin/companies/members"],
  ["removeCompaniesMember", () => admin.removeCompaniesMember(U), "DELETE", `/admin/companies/members/${eU}`],
  ["getCompaniesAdmins", () => admin.getCompaniesAdmins(), "GET", "/admin/companies/admins"],
  ["searchCompaniesEligibleAdmins", () => admin.searchCompaniesEligibleAdmins("ana paz"), "GET", "/admin/companies/admins/search?q=ana%20paz"],
  ["addCompaniesAdmin", () => admin.addCompaniesAdmin(U), "POST", `/admin/companies/admins/${eU}`],
  ["removeCompaniesAdmin", () => admin.removeCompaniesAdmin(U), "DELETE", `/admin/companies/admins/${eU}`],
  // Profile and support
  ["getProfileByUserId", () => profile.getProfileByUserId(U).catch(() => undefined), "GET", `/profile/${eU}`],
  ["saveMyProfile", () => profile.saveMyProfile({ firstName: "Ana", lastName: "Paz" }), "POST", "/profile/me", { firstName: "Ana", lastName: "Paz" }],
  [
    "patchWorkExperiences",
    () => profile.patchWorkExperiences({ operations: [{ action: "REMOVE", id: "w1" }] }),
    "PATCH",
    "/profile/work-experiences",
    { operations: [{ action: "REMOVE", id: "w1" }] },
  ],
  [
    "patchEducationHistory",
    () => profile.patchEducationHistory({ operations: [{ action: "REMOVE", id: "e1" }] }),
    "PATCH",
    "/profile/education-history",
    { operations: [{ action: "REMOVE", id: "e1" }] },
  ],
  ["sendContactMessage", () => profile.sendContactMessage("SUGGESTION" as Parameters<typeof profile.sendContactMessage>[0], "Idea"), "POST", "/support/contact", { category: "SUGGESTION", details: "Idea" }],
  ["searchProfiles", () => profile.searchProfiles("  Ana Paz "), "GET", "/profile/search?text=Ana+Paz"],
  ["searchInterestSuggestions", () => profile.searchInterestSuggestions(" lógica "), "GET", `/profile/interests/suggestions?text=${encodeURIComponent("lógica")}`],
  ["getMyPreferences", () => profile.getMyPreferences(), "GET", "/profile/me/preferences"],
  ["updateMyPreferences", () => profile.updateMyPreferences("dark"), "PATCH", "/profile/me/preferences", { themePreference: "dark" }],
  // Verbum
  ["getVerbumPuzzle (today)", () => verbum.getVerbumPuzzle(null), "GET", "/games/verbum/today"],
  ["getVerbumPuzzle (day)", () => verbum.getVerbumPuzzle(G), "GET", `/games/verbum/puzzles/${eG}`],
  ["submitVerbumGuess", () => verbum.submitVerbumGuess(G, "ROBOT"), "POST", `/games/verbum/puzzles/${eG}/guesses`, { guess: "ROBOT" }],
  ["getVerbumCalendar", () => verbum.getVerbumCalendar(), "GET", "/games/verbum/calendar"],
  ["getVerbumStats", () => verbum.getVerbumStats(), "GET", "/games/verbum/stats"],
];

describe("API contract with the backend", () => {
  it.each(cases)("%s", async (_name, call, method, path, body) => {
    const mock = mockFetch(dataEnvelope);

    await call();

    expect(mock.requests).toHaveLength(1);
    expect(mock.last.method).toBe(method);
    expect(mock.last.path).toBe(path);
    expect(mock.last.credentials).toBe("include");
    if (body !== undefined) {
      expect(mock.last.body).toEqual(body);
    }
  });

  it("sends topic attachments and feed PDFs as multipart form data", async () => {
    const mock = mockFetch(dataEnvelope);
    const image = new File(["png"], "foto.png", { type: "image/png" });

    await ateneo.createAteneoTopic(G, { title: "Tema", description: "Desc", tone: "MIX", attachments: [image] });
    const topicForm = mock.last.body as FormData;
    expect(mock.last.path).toBe(`/ateneo/groups/${eG}/topics`);
    expect(topicForm.get("title")).toBe("Tema");
    expect(topicForm.get("tone")).toBe("MIX");
    expect((topicForm.getAll("attachments")[0] as File).name).toBe("foto.png");

    const pdf = new File(["%PDF"], "paper.pdf", { type: "application/pdf" });
    await feed.createFeedPost({ content: "  Hola  ", pdfFiles: [pdf] });
    const feedForm = mock.last.body as FormData;
    expect(mock.last.path).toBe("/feed");
    expect(feedForm.get("content")).toBe("Hola");
    expect((feedForm.getAll("pdfFiles")[0] as File).name).toBe("paper.pdf");

    await feed.createFeedPost({ content: "   " });
    expect((mock.last.body as FormData).has("content")).toBe(false);

    await profile.submitBugReport({ title: "Bug", description: "Desc", pageUrl: "https://x", screenshots: [image] });
    const bugForm = mock.last.body as FormData;
    expect(mock.last.path).toBe("/support/bug-reports");
    expect(bugForm.get("pageUrl")).toBe("https://x");
    expect(bugForm.getAll("screenshots")).toHaveLength(1);
  });

  it("skips the request for too-short searches", async () => {
    const mock = mockFetch(dataEnvelope);

    expect(await profile.searchInterestSuggestions("ab")).toEqual({ success: true, message: "", data: [] });
    expect(await profile.searchProfiles("   ")).toEqual({ success: true, message: "", data: [] });
    expect(mock.requests).toHaveLength(0);
  });
});

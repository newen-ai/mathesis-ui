import {
	apiRequest,
	parseDataResponse,
} from "@/lib/api/client";

export type FeedSortBy = "NEWEST" | "OLDEST" | "RECENTLY_UPDATED" | "HOT";
export type FeedReactionValue = "value";

export type FeedAuthor = {
	userId: string;
	firstName: string | null;
	lastName: string | null;
	profileImageUrl?: string | null;
	currentJobTitle: string | null;
	currentCompany: string | null;
};

export type FeedAttachment = {
	id: string;
	fileName: string;
	mimeType: string;
	sizeBytes: number;
};

export type FeedPost = {
	id: string;
	authorUserId: string;
	author: FeedAuthor;
	content: string | null;
	attachments: FeedAttachment[];
	reactionCount: number;
	currentUserReactionValue: FeedReactionValue | null;
	createdAt: string;
	updatedAt: string;
};

export type FeedPostsListData = {
	posts: FeedPost[];
};

export type FeedPostCreateInput = {
	content?: string;
	pdfFiles?: File[];
	signal?: AbortSignal;
};

export type FeedPostCreatedData = {
	post: FeedPost;
};

export type FeedPostDeletedData = {
	postId: string;
	deletedAt: string;
};

export type FeedPostReactionToggledData = {
	post: FeedPost;
};

export type FeedAttachmentDownloadErrorCode =
	| "UNAUTHORIZED"
	| "NOT_FOUND"
	| "INVALID_CONTENT_TYPE"
	| "UNKNOWN";

export class FeedAttachmentDownloadError extends Error {
	code: FeedAttachmentDownloadErrorCode;
	status?: number;

	constructor(
		code: FeedAttachmentDownloadErrorCode,
		message: string,
		status?: number
	) {
		super(message);
		this.name = "FeedAttachmentDownloadError";
		this.code = code;
		this.status = status;
	}
}

export type FeedAttachmentDownloadFileData = {
	blob: Blob;
	fileName: string | null;
};

export type FeedListInput = {
	limit?: number;
	sortBy?: FeedSortBy;
	gravity?: number;
	signal?: AbortSignal;
};

export async function listFeedPosts({
	limit = 20,
	sortBy = "HOT",
	gravity,
	signal,
}: FeedListInput = {}) {
	const query = new URLSearchParams();
	query.set("limit", String(limit));
	query.set("sortBy", sortBy);

	if (gravity !== undefined) {
		query.set("gravity", String(gravity));
	}

	const response = await apiRequest(`/feed?${query.toString()}`, {
		signal,
	});

	return parseDataResponse<FeedPostsListData>(
		response,
		"Invalid feed list response"
	);
}

export async function createFeedPost({
	content,
	pdfFiles = [],
	signal,
}: FeedPostCreateInput) {
	const formData = new FormData();
	const trimmedContent = content?.trim() ?? "";

	if (trimmedContent) {
		formData.set("content", trimmedContent);
	}

	pdfFiles.forEach((file) => {
		formData.append("pdfFiles", file, file.name);
	});

	const response = await apiRequest("/feed", {
		method: "POST",
		body: formData,
		signal,
	});

	return parseDataResponse<FeedPostCreatedData>(
		response,
		"Invalid feed create response"
	);
}

export async function deleteFeedPost(postId: string, signal?: AbortSignal) {
	const response = await apiRequest(`/feed/${encodeURIComponent(postId)}`, {
		method: "DELETE",
		signal,
	});

	return parseDataResponse<FeedPostDeletedData>(
		response,
		"Invalid feed delete response"
	);
}

export async function toggleFeedPostReaction(
	postId: string,
	reactionValue: FeedReactionValue = "value",
	signal?: AbortSignal
) {
	const response = await apiRequest(`/feed/${encodeURIComponent(postId)}/reactions`, {
		method: "POST",
		body: {
			reactionValue,
		},
		signal,
	});

	return parseDataResponse<FeedPostReactionToggledData>(
		response,
		"Invalid feed reaction toggle response"
	);
}

function parseFileNameFromContentDisposition(value: string | null) {
	if (!value) return null;

	const filenameStarMatch = value.match(/filename\*\s*=\s*([^;]+)/i);
	if (filenameStarMatch?.[1]) {
		const rawValue = filenameStarMatch[1].trim().replace(/^"|"$/g, "");
		const encodedPart = rawValue.includes("''")
			? rawValue.split("''").slice(1).join("''")
			: rawValue;

		try {
			return decodeURIComponent(encodedPart);
		} catch {
			return encodedPart;
		}
	}

	const filenameMatch = value.match(/filename\s*=\s*([^;]+)/i);
	if (!filenameMatch?.[1]) {
		return null;
	}

	return filenameMatch[1].trim().replace(/^"|"$/g, "");
}

export async function downloadFeedAttachmentFile(
	postId: string,
	attachmentId: string,
	signal?: AbortSignal
): Promise<FeedAttachmentDownloadFileData> {
	const response = await apiRequest(
		`/feed/${encodeURIComponent(postId)}/attachments/${encodeURIComponent(attachmentId)}`,
		{
			signal,
		}
	);

	if (response.status === 401) {
		throw new FeedAttachmentDownloadError(
			"UNAUTHORIZED",
			"Authentication required to download attachment",
			401
		);
	}

	if (response.status === 404) {
		throw new FeedAttachmentDownloadError(
			"NOT_FOUND",
			"Attachment not found",
			404
		);
	}

	if (!response.ok) {
		throw new FeedAttachmentDownloadError(
			"UNKNOWN",
			`Could not download attachment: ${response.status}`,
			response.status
		);
	}

	const contentType = response.headers.get("content-type") ?? "";
	if (!contentType.toLowerCase().includes("application/pdf")) {
		throw new FeedAttachmentDownloadError(
			"INVALID_CONTENT_TYPE",
			"Attachment response is not a PDF",
			response.status
		);
	}

	const blob = await response.blob();
	const fileName = parseFileNameFromContentDisposition(
		response.headers.get("content-disposition")
	);

	return {
		blob,
		fileName,
	};
}

export async function downloadFeedAttachment(
	postId: string,
	attachmentId: string,
	signal?: AbortSignal
): Promise<Blob> {
	const payload = await downloadFeedAttachmentFile(postId, attachmentId, signal);
	return payload.blob;
}
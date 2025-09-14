import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import axios, { AxiosInstance } from "axios"
import FormData from "form-data"
import * as dotenv from "dotenv"

dotenv.config()

interface RedditAuthResponse {
	access_token: string
	token_type: string
	expires_in: number
	scope: string
}

interface RedditPost {
	id: string
	title: string
	selftext: string
	author: string
	subreddit: string
	created_utc: number
	score: number
	upvote_ratio: number
	num_comments: number
	permalink: string
	url: string
	thumbnail?: string
	is_self: boolean
	over_18: boolean
}

interface SubredditStats {
	name: string
	display_name: string
	subscribers: number
	active_user_count: number
	description: string
	created_utc: number
	over18: boolean
	lang: string
	subreddit_type: string
}

interface SubredditAnalytics {
	subreddit: SubredditStats
	top_posts: RedditPost[]
	trending_topics: string[]
	engagement_metrics: {
		avg_score: number
		avg_comments: number
		avg_upvote_ratio: number
		post_frequency: number
	}
}

interface AdContent {
	title: string
	body: string
	target_subreddit: string
	suggested_keywords: string[]
	engagement_prediction: string
}

interface RedditAd {
	id: string
	name: string
	campaign_objective_type: string
	configured_status: string
	click_url: string
	post_id?: string
	profile_id?: string
}

interface AdAccount {
	id: string
	name: string
	status: string
	currency: string
}

interface FundingInstrument {
	id: string
	name: string
	type: string
	status: string
	currency: string
	balance?: number
}

interface Campaign {
	id: string
	name: string
	status: string
	objective: string
	funding_instrument_id: string
	created_at: string
	updated_at: string
	start_date?: string
	end_date?: string
}

interface AdGroup {
	id: string
	name: string
	status: string
	campaign_id: string
	bid_strategy: string
	daily_budget?: number
	total_budget?: number
	created_at: string
	updated_at: string
	start_date?: string
	end_date?: string
}

interface Profile {
	id: string
	username: string
	display_name: string
	profile_type: string
	status: string
	created_at: string
	updated_at: string
	avatar_url?: string
	description?: string
}

interface Post {
	id: string
	title: string
	url?: string
	text?: string
	subreddit: string
	post_type: string
	status: string
	created_at: string
	updated_at: string
	permalink: string
	score?: number
	num_comments?: number
}

class RedditClient {
	private axiosInstance: AxiosInstance
	private adsAxiosInstance: AxiosInstance
	private accessToken: string | null = null
	private tokenExpiry: number = 0

	constructor() {
		this.axiosInstance = axios.create({
			headers: {
				"User-Agent": process.env.REDDIT_USER_AGENT || "mcp-reddit-ads-server:v1.0.0",
			},
		})
		
		this.adsAxiosInstance = axios.create({
			baseURL: "https://ads-api.reddit.com/api/v3",
			headers: {
				"Content-Type": "application/json",
				"Accept": "application/json",
				"Authorization": `Bearer ${process.env.REDDIT_BEARER_TOKEN}`,
				"User-Agent": process.env.REDDIT_USER_AGENT || "mcp-reddit-ads-server:v1.0.0",
			},
		})
	}

	async getAdAccounts(businessId?: string): Promise<AdAccount[]> {
		try {
			const targetBusinessId = businessId || "ae546532-7e65-4bf1-91a2-e46f27a1626d"
			if (!targetBusinessId) {
				throw new Error("Business ID is required. Provide it as parameter or set REDDIT_BUSINESS_ID environment variable.")
			}

			const response = await this.adsAxiosInstance.get(`/businesses/${targetBusinessId}/ad_accounts`)
			
			return response.data.data?.map((account: any) => ({
				id: account.id,
				name: account.name,
				status: account.status,
				currency: account.currency
			})) || []
		} catch (error) {
			console.error("Failed to fetch ad accounts:", error)
			throw new Error(`Failed to fetch ad accounts: ${error}`)
		}
	}

	async getFundingInstruments(adAccountId: string): Promise<FundingInstrument[]> {
		try {
			const response = await this.adsAxiosInstance.get(`/ad_accounts/${adAccountId}/funding_instruments`)
			
			return response.data.data?.map((instrument: any) => ({
				id: instrument.id,
				name: instrument.name,
				type: instrument.type,
				status: instrument.status,
				currency: instrument.currency,
				balance: instrument.balance
			})) || []
		} catch (error: any) {
			console.error("Failed to fetch funding instruments:", error.response?.data || error)
			throw new Error(`Failed to fetch funding instruments: ${error.response?.data?.message || error.message}`)
		}
	}

	async getCampaigns(adAccountId: string): Promise<Campaign[]> {
		try {
			const response = await this.adsAxiosInstance.get(`/ad_accounts/${adAccountId}/campaigns`)
			
			return response.data.data?.map((campaign: any) => ({
				id: campaign.id,
				name: campaign.name,
				status: campaign.status,
				objective: campaign.objective,
				funding_instrument_id: campaign.funding_instrument_id,
				created_at: campaign.created_at,
				updated_at: campaign.updated_at,
				start_date: campaign.start_date,
				end_date: campaign.end_date
			})) || []
		} catch (error: any) {
			console.error("Failed to fetch campaigns:", error.response?.data || error)
			throw new Error(`Failed to fetch campaigns: ${error.response?.data?.message || error.message}`)
		}
	}

	async getAdGroups(adAccountId: string): Promise<AdGroup[]> {
		try {
			const response = await this.adsAxiosInstance.get(`/ad_accounts/${adAccountId}/ad_groups`)
			
			return response.data.data?.map((adGroup: any) => ({
				id: adGroup.id,
				name: adGroup.name,
				status: adGroup.status,
				campaign_id: adGroup.campaign_id,
				bid_strategy: adGroup.bid_strategy,
				daily_budget: adGroup.daily_budget,
				total_budget: adGroup.total_budget,
				created_at: adGroup.created_at,
				updated_at: adGroup.updated_at,
				start_date: adGroup.start_date,
				end_date: adGroup.end_date
			})) || []
		} catch (error: any) {
			console.error("Failed to fetch ad groups:", error.response?.data || error)
			throw new Error(`Failed to fetch ad groups: ${error.response?.data?.message || error.message}`)
		}
	}

	async getProfiles(adAccountId: string): Promise<Profile[]> {
		try {
			const response = await this.adsAxiosInstance.get(`/ad_accounts/${adAccountId}/profiles`)
			
			return response.data.data?.map((profile: any) => ({
				id: profile.id,
				username: profile.username,
				display_name: profile.display_name,
				profile_type: profile.profile_type,
				status: profile.status,
				created_at: profile.created_at,
				updated_at: profile.updated_at,
				avatar_url: profile.avatar_url,
				description: profile.description
			})) || []
		} catch (error: any) {
			console.error("Failed to fetch profiles:", error.response?.data || error)
			throw new Error(`Failed to fetch profiles: ${error.response?.data?.message || error.message}`)
		}
	}

	async getPosts(profileId: string): Promise<Post[]> {
		try {
			const response = await this.adsAxiosInstance.get(`/profiles/${profileId}/posts`)
			
			return response.data.data?.map((post: any) => ({
				id: post.id,
				title: post.title,
				url: post.url,
				text: post.text,
				subreddit: post.subreddit,
				post_type: post.post_type,
				status: post.status,
				created_at: post.created_at,
				updated_at: post.updated_at,
				permalink: post.permalink,
				score: post.score,
				num_comments: post.num_comments
			})) || []
		} catch (error: any) {
			console.error("Failed to fetch posts:", error.response?.data || error)
			throw new Error(`Failed to fetch posts: ${error.response?.data?.message || error.message}`)
		}
	}

	async getPost(postId: string): Promise<Post | null> {
		try {
			const response = await this.adsAxiosInstance.get(`/posts/${postId}`)
			
			if (response.data.data) {
				const post = response.data.data
				return {
					id: post.id,
					title: post.title,
					url: post.url,
					text: post.text,
					subreddit: post.subreddit,
					post_type: post.post_type,
					status: post.status,
					created_at: post.created_at,
					updated_at: post.updated_at,
					permalink: post.permalink,
					score: post.score,
					num_comments: post.num_comments
				}
			}
			
			return null
		} catch (error: any) {
			console.error("Failed to fetch post:", error.response?.data || error)
			throw new Error(`Failed to fetch post: ${error.response?.data?.message || error.message}`)
		}
	}

	async createCampaign(
		adAccountId: string,
		name: string,
		objective: string,
		fundingInstrumentId: string,
		configuredStatus: string = "ACTIVE",
		spendCap?: number,
		goalValue?: number,
		goalType?: string,
		appId?: string,
		ageRestriction: string = "NO_AGE_RESTRICTION"
	): Promise<Campaign | null> {
		try {
			const campaignData: any = {
				data: {
					name: name,
					configured_status: configuredStatus,
					objective: objective,
					funding_instrument_id: fundingInstrumentId,
					age_restriction: ageRestriction
				}
			}

			if (spendCap !== undefined) {
				campaignData.data.spend_cap = spendCap
			}

			if (goalValue !== undefined) {
				campaignData.data.goal_value = goalValue
			}

			if (goalType) {
				campaignData.data.goal_type = goalType
			}

			if (appId) {
				campaignData.data.app_id = appId
			}

			const response = await this.adsAxiosInstance.post(
				`/ad_accounts/${adAccountId}/campaigns`,
				campaignData
			)

			if (response.data && response.data.data) {
				const campaign = response.data.data
				return {
					id: campaign.id,
					name: campaign.name,
					status: campaign.status || campaign.configured_status,
					objective: campaign.objective,
					funding_instrument_id: campaign.funding_instrument_id,
					created_at: campaign.created_at,
					updated_at: campaign.updated_at,
					start_date: campaign.start_date,
					end_date: campaign.end_date
				}
			}

			return null
		} catch (error: any) {
			console.error("Failed to create campaign:", error.response?.data || error)
			throw new Error(`Failed to create campaign: ${error.response?.data?.message || error.message}`)
		}
	}

	async createAdGroup(
		adAccountId: string,
		campaignId: string,
		name: string,
		configuredStatus: string = "ACTIVE",
		bidType?: string,
		bidValue?: number,
		bidStrategy?: string,
		goalValue?: number,
		goalType?: string,
		startTime?: string,
		endTime?: string,
		optimizationGoal?: string,
		targeting?: any,
		appId?: string
	): Promise<AdGroup | null> {
		try {
			const adGroupData: any = {
				data: {
					campaign_id: campaignId,
					name: name,
					configured_status: configuredStatus
				}
			}

			if (bidType) {
				adGroupData.data.bid_type = bidType
			}

			if (bidValue !== undefined) {
				adGroupData.data.bid_value = bidValue
			}

			if (bidStrategy) {
				adGroupData.data.bid_strategy = bidStrategy
			}

			if (goalValue !== undefined) {
				adGroupData.data.goal_value = goalValue
			}

			if (goalType) {
				adGroupData.data.goal_type = goalType
			}

			if (startTime) {
				adGroupData.data.start_time = startTime
			}

			if (endTime) {
				adGroupData.data.end_time = endTime
			}

			if (optimizationGoal) {
				adGroupData.data.optimization_goal = optimizationGoal
			}

			if (targeting) {
				adGroupData.data.targeting = targeting
			}

			if (appId) {
				adGroupData.data.app_id = appId
			}

			const response = await this.adsAxiosInstance.post(
				`/ad_accounts/${adAccountId}/ad_groups`,
				adGroupData
			)

			if (response.data && response.data.data) {
				const adGroup = response.data.data
				return {
					id: adGroup.id,
					name: adGroup.name,
					status: adGroup.status || adGroup.configured_status,
					campaign_id: adGroup.campaign_id,
					bid_strategy: adGroup.bid_strategy,
					daily_budget: adGroup.daily_budget,
					total_budget: adGroup.total_budget,
					created_at: adGroup.created_at,
					updated_at: adGroup.updated_at,
					start_date: adGroup.start_date,
					end_date: adGroup.end_date
				}
			}

			return null
		} catch (error: any) {
			console.error("Failed to create ad group:", error.response?.data || error)
			throw new Error(`Failed to create ad group: ${error.response?.data?.message || error.message}`)
		}
	}

	async generateImage(description: string): Promise<string | null> {
		try {
			const apiKey = process.env.GOOGLE_GEMINI_API_KEY
			
			if (!apiKey) {
				console.warn("Google Gemini API key not configured, skipping image generation")
				return null
			}
			
			// Using Gemini Flash Image Preview (free tier compatible)
			const response = await axios.post(
				`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent`,
				{
					contents: [{
						parts: [
							{
								text: `Generate a high-quality image based on this description: ${description}. Make it photorealistic and suitable for advertising.`
							}
						]
					}]
				},
				{
					headers: {
						'x-goog-api-key': apiKey,
						'Content-Type': 'application/json'
					}
				}
			)

			console.log("generateImage response:", JSON.stringify(response.data, null, 2))

			if (response.data?.candidates?.[0]?.content?.parts) {
				// Find the image part in the response
				for (const part of response.data.candidates[0].content.parts) {
					if (part.inlineData?.data) {
						// Upload to PostImages and return the URL
						const mimeType = part.inlineData.mimeType || 'image/png'
						const base64Data = `data:${mimeType};base64,${part.inlineData.data}`
						const imageUrl = await this.uploadToPostImages(base64Data)
						return imageUrl
					}
				}
			}

			return null
		} catch (error: any) {
			console.error("Failed to generate image:", error.response?.data || error)
			return null // Don't fail the post creation if image generation fails
		}
	}

	async uploadToPostImages(base64Data: string): Promise<string | null> {
		// Try multiple Reddit-compatible image hosts
		const imgbbUrl = await this.uploadToImgBB(base64Data)
		if (imgbbUrl) {
			return imgbbUrl
		}
		
		const uploadCareUrl = await this.uploadToUploadCare(base64Data)
		if (uploadCareUrl) {
			return uploadCareUrl
		}
		
		// If all uploads fail, create a temporary data URL that can be used inline
		console.warn("All image upload services failed, using base64 data URL")
		return base64Data
	}

	async uploadToImgBB(base64Data: string): Promise<string | null> {
		try {
			// Remove the data URL prefix to get just the base64 data
			const base64Image = base64Data.split(',')[1]
			
			const formData = new FormData()
			formData.append('image', base64Image)
			
			const apiKey = process.env.IMGBB_API_KEY || 'd0b1b2c3d4e5f6g7h8i9j0k1l2m3n4o5'
			const response = await axios.post(
				`https://api.imgbb.com/1/upload?key=${apiKey}`,
				formData,
				{
					headers: {
						...formData.getHeaders()
					}
				}
			)

			if (response.data?.success && response.data?.data?.url) {
				console.log("Successfully uploaded to ImgBB:", response.data.data.url)
				return response.data.data.url
			}

			console.warn("ImgBB upload failed:", response.data)
			return null
		} catch (error: any) {
			console.error("Failed to upload to ImgBB:", error.response?.data || error)
			return null
		}
	}

	async uploadToUploadCare(base64Data: string): Promise<string | null> {
		try {
			// Remove the data URL prefix to get just the base64 data
			const base64Image = base64Data.split(',')[1]
			const imageBuffer = Buffer.from(base64Image, 'base64')
			
			const formData = new FormData()
			const pubKey = process.env.UPLOADCARE_PUB_KEY || 'demopublickey'
			formData.append('UPLOADCARE_PUB_KEY', pubKey)
			formData.append('file', imageBuffer, {
				filename: `generated-${Date.now()}.png`,
				contentType: 'image/png'
			})
			
			const response = await axios.post(
				'https://upload.uploadcare.com/base/',
				formData,
				{
					headers: {
						...formData.getHeaders()
					}
				}
			)

			if (response.data?.file) {
				const imageUrl = `https://ucarecdn.com/${response.data.file}/`
				console.log("Successfully uploaded to UploadCare:", imageUrl)
				return imageUrl
			}

			console.warn("UploadCare upload failed:", response.data)
			return null
		} catch (error: any) {
			console.error("Failed to upload to UploadCare:", error.response?.data || error)
			return null
		}
	}

	async createPost(
		profileId: string,
		type: string,
		headline: string,
		allowComments: boolean = true,
		body?: string,
		thumbnailUrl?: string,
		content?: Array<{
			call_to_action?: string,
			destination_url?: string,
			display_url?: string,
			media_url?: string
		}>,
		isRichtext?: boolean,
		imageDescription?: string
	): Promise<Post | null> {
		try {
			// Generate image if description provided
			let generatedImageUrl: string | null = null
			if (imageDescription) {
				generatedImageUrl = await this.generateImage(imageDescription)
				if (!thumbnailUrl && generatedImageUrl) {
					thumbnailUrl = generatedImageUrl
				}
			}
			const postData: any = {
				data: {
					type: type,
					headline: headline,
					allow_comments: allowComments
				}
			}

			if (body) {
				postData.data.body = body
			}

			if (thumbnailUrl) {
				postData.data.thumbnail_url = thumbnailUrl
			}

			if (content && content.length > 0) {
				postData.data.content = content
			}

			if (isRichtext !== undefined) {
				postData.data.is_richtext = isRichtext
			}

			const response = await this.adsAxiosInstance.post(
				`/profiles/${profileId}/posts`,
				postData
			)

			if (response.data && response.data.data) {
				const post = response.data.data
				return {
					id: post.id,
					title: post.headline || post.title,
					url: post.post_url,
					text: post.body,
					subreddit: post.subreddit || "",
					post_type: post.type,
					status: post.status || "published",
					created_at: post.created_at,
					updated_at: post.updated_at || post.created_at,
					permalink: post.post_url || "",
					score: post.score,
					num_comments: post.num_comments
				}
			}

			return null
		} catch (error: any) {
			console.error("Failed to create post:", error.response?.data || error)
			throw new Error(`Failed to create post: ${error.response?.data?.message || error.message}`)
		}
	}

	async createAd(
		adAccountId: string,
		name: string,
		configuredStatus: string,
		adGroupId?: string,
		campaignId?: string,
		clickUrl?: string,
		postId?: string,
		campaignObjectiveType?: string,
		profileId?: string,
		profileUsername?: string,
		clickUrlQueryParams?: Array<{name: string, value: string}>,
		eventTrackers?: Array<{type: string, url: string}>,
		shoppingCreative?: {
			allow_comments?: boolean,
			call_to_action?: string,
			destination_url?: string,
			headline?: string,
			second_line_cta?: string,
			dpa_carousel_mode?: string
		},
		products?: Array<{product_id: string}>,
		previewExpiry?: string
	): Promise<RedditAd | null> {
		try {
			const adData: any = {
				data: {
					type: "UNSPECIFIED",
					name: name,
					configured_status: configuredStatus
				}
			}

			if (adGroupId) {
				adData.data.ad_group_id = adGroupId
			}

			if (campaignId) {
				adData.data.campaign_id = campaignId
			}

			if (clickUrl) {
				adData.data.click_url = clickUrl
			}

			if (postId) {
				adData.data.post_id = postId
			}

			if (campaignObjectiveType) {
				adData.data.campaign_objective_type = campaignObjectiveType
			}

			if (profileId) {
				adData.data.profile_id = profileId
			}

			if (profileUsername) {
				adData.data.profile_username = profileUsername
			}

			if (clickUrlQueryParams && clickUrlQueryParams.length > 0) {
				adData.data.click_url_query_parameters = clickUrlQueryParams
			}

			if (eventTrackers && eventTrackers.length > 0) {
				adData.data.event_trackers = eventTrackers
			}

			if (shoppingCreative) {
				adData.data.shopping_creative = shoppingCreative
			}

			if (products && products.length > 0) {
				adData.data.products = products
			}

			if (previewExpiry) {
				adData.data.preview_expiry = previewExpiry
			}

			const response = await this.adsAxiosInstance.post(
				`/ad_accounts/${adAccountId}/ads`,
				adData
			)

			if (response.data && response.data.data) {
				const ad = response.data.data
				return {
					id: ad.id,
					name: ad.name,
					campaign_objective_type: ad.campaign_objective_type,
					configured_status: ad.configured_status,
					click_url: ad.click_url,
					post_id: ad.post_id,
					profile_id: ad.profile_id
				}
			}

			return null
		} catch (error: any) {
			console.error("Failed to create ad:", error.response?.data || error)
			throw new Error(`Failed to create ad: ${error.response?.data?.message || error.message}`)
		}
	}

	async getAds(adAccountId: string): Promise<RedditAd[]> {
		try {
			const response = await this.adsAxiosInstance.get(`/ad_accounts/${adAccountId}/ads`)
			console.log("getAds response:", JSON.stringify(response.data, null, 2))
			
			if (response.data && response.data.data) {
				return response.data.data.map((ad: any) => ({
					id: ad.id,
					name: ad.name,
					campaign_objective_type: ad.campaign_objective_type,
					configured_status: ad.configured_status,
					click_url: ad.click_url,
					post_id: ad.post_id,
					profile_id: ad.profile_id,
					ad_group_id: ad.ad_group_id,
					campaign_id: ad.campaign_id,
					created_at: ad.created_at,
					updated_at: ad.updated_at
				}))
			}
			
			return []
		} catch (error: any) {
			console.error("Failed to get ads:", error.response?.data || error)
			throw new Error(`Failed to get ads: ${error.response?.data?.message || error.message}`)
		}
	}

	generateAdContent(analytics: SubredditAnalytics, product: string, targetAudience: string): AdContent {
		const { subreddit, trending_topics, engagement_metrics } = analytics
		
		const title = `Discover ${product} - Perfect for ${targetAudience} in r/${subreddit.display_name}!`
		
		const body = `Hey r/${subreddit.display_name}! 

Based on the trending discussions around ${trending_topics.slice(0, 3).join(', ')}, we thought you'd be interested in ${product}.

Why it's perfect for this community:
- Addresses the ${trending_topics[0]} discussions we've seen trending
- Built specifically for ${targetAudience}
- High engagement potential (community avg: ${engagement_metrics.avg_score} upvotes, ${engagement_metrics.avg_comments} comments)

What do you think? Would love to hear your thoughts!

[Learn more about ${product}]`

		const engagementPrediction = engagement_metrics.avg_score > 100 
			? "High engagement expected based on community metrics"
			: engagement_metrics.avg_score > 50
			? "Moderate engagement expected"
			: "Lower engagement expected - consider refining targeting"

		return {
			title,
			body,
			target_subreddit: subreddit.display_name,
			suggested_keywords: trending_topics.slice(0, 5),
			engagement_prediction: engagementPrediction
		}
	}
}

export const configSchema = z.object({
	REDDIT_BEARER_TOKEN: z.string().describe("Reddit Ads API Bearer Token"),
	REDDIT_BUSINESS_ID: z.string().describe("Reddit Business ID for ads account access"),
	GOOGLE_GEMINI_API_KEY: z.string().optional().describe("Google Gemini/Imagen API Key for image generation"),
	IMGBB_API_KEY: z.string().optional().describe("ImgBB API Key for image hosting"),
	UPLOADCARE_PUB_KEY: z.string().optional().describe("UploadCare Public Key for image hosting"),
})

export default function createServer({
	config,
}: {
	config: z.infer<typeof configSchema>
}) {
	const server = new McpServer({
		name: "Reddit Ads MCP",
		version: "1.0.0",
	})

	const redditClient = new RedditClient()


	server.registerTool(
		"getAdAccounts",
		{
			title: "Get Ad Accounts",
			description: "Get all available Reddit ad accounts for a business",
			inputSchema: {
				businessId: z.string().optional().describe("Reddit Business ID (optional if REDDIT_BUSINESS_ID env var is set)"),
			},
		},
		async ({ businessId }) => {
			try {
				const accounts = await redditClient.getAdAccounts(businessId)
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(accounts, null, 2),
						},
					],
				}
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: `Error fetching ad accounts: ${error}`,
						},
					],
					isError: true,
				}
			}
		}
	)

	server.registerTool(
		"getFundingInstruments",
		{
			title: "Get Funding Instruments",
			description: "Get all payment methods/funding instruments for an ad account",
			inputSchema: {
				adAccountId: z.string().describe("Reddit ad account ID"),
			},
		},
		async ({ adAccountId }) => {
			try {
				const instruments = await redditClient.getFundingInstruments(adAccountId)
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(instruments, null, 2),
						},
					],
				}
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: `Error fetching funding instruments: ${error}`,
						},
					],
					isError: true,
				}
			}
		}
	)

	server.registerTool(
		"getCampaigns",
		{
			title: "Get Campaigns",
			description: "Get all campaigns for an ad account",
			inputSchema: {
				adAccountId: z.string().describe("Reddit ad account ID"),
			},
		},
		async ({ adAccountId }) => {
			try {
				const campaigns = await redditClient.getCampaigns(adAccountId)
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(campaigns, null, 2),
						},
					],
				}
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: `Error fetching campaigns: ${error}`,
						},
					],
					isError: true,
				}
			}
		}
	)

	server.registerTool(
		"getAdGroups",
		{
			title: "Get Ad Groups",
			description: "Get all ad groups for an ad account",
			inputSchema: {
				adAccountId: z.string().describe("Reddit ad account ID"),
			},
		},
		async ({ adAccountId }) => {
			try {
				const adGroups = await redditClient.getAdGroups(adAccountId)
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(adGroups, null, 2),
						},
					],
				}
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: `Error fetching ad groups: ${error}`,
						},
					],
					isError: true,
				}
			}
		}
	)

	server.registerTool(
		"getProfiles",
		{
			title: "Get Profiles",
			description: "Get all Reddit profiles/accounts available for an ad account",
			inputSchema: {
				adAccountId: z.string().describe("Reddit ad account ID"),
			},
		},
		async ({ adAccountId }) => {
			try {
				const profiles = await redditClient.getProfiles(adAccountId)
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(profiles, null, 2),
						},
					],
				}
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: `Error fetching profiles: ${error}`,
						},
					],
					isError: true,
				}
			}
		}
	)

	server.registerTool(
		"getPosts",
		{
			title: "Get Posts",
			description: "Get all posts for a specific Reddit profile",
			inputSchema: {
				profileId: z.string().describe("Reddit profile ID"),
			},
		},
		async ({ profileId }) => {
			try {
				const posts = await redditClient.getPosts(profileId)
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(posts, null, 2),
						},
					],
				}
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: `Error fetching posts: ${error}`,
						},
					],
					isError: true,
				}
			}
		}
	)

	server.registerTool(
		"getPost",
		{
			title: "Get Post",
			description: "Get details for a specific Reddit post",
			inputSchema: {
				postId: z.string().describe("Reddit post ID"),
			},
		},
		async ({ postId }) => {
			try {
				const post = await redditClient.getPost(postId)
				return {
					content: [
						{
							type: "text",
							text: post
								? JSON.stringify(post, null, 2)
								: `Post with ID ${postId} not found`,
						},
					],
					isError: !post,
				}
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: `Error fetching post: ${error}`,
						},
					],
					isError: true,
				}
			}
		}
	)

	server.registerTool(
		"createCampaign",
		{
			title: "Create Campaign",
			description: "Create a new Reddit advertising campaign",
			inputSchema: {
				adAccountId: z.string().describe("Reddit ad account ID"),
				name: z.string().min(3).max(200).describe("Campaign name (3-200 characters)"),
				objective: z.enum([
					"APP_INSTALLS",
					"CATALOG_SALES", 
					"CLICKS",
					"CONVERSIONS",
					"IMPRESSIONS",
					"LEAD_GENERATION",
					"VIDEO_VIEWABLE_IMPRESSIONS"
				]).describe("Campaign objective type"),
				fundingInstrumentId: z.string().describe("Funding instrument ID for payment"),
				configuredStatus: z.enum(["ACTIVE", "ARCHIVED", "DELETED", "PAUSED"]).default("ACTIVE").describe("Campaign status"),
				spendCap: z.number().optional().describe("Campaign lifetime spend cap in microcurrency"),
				goalValue: z.number().optional().describe("Campaign level goal value in micros (requires CBO)"),
				goalType: z.enum(["LIFETIME_SPEND", "DAILY_SPEND"]).optional().describe("Campaign goal type (requires CBO)"),
				appId: z.string().optional().describe("App ID for app installs campaigns (Apple App Store or Google Play)"),
				ageRestriction: z.enum(["ABOVE_18", "ABOVE_21", "NO_AGE_RESTRICTION"]).default("NO_AGE_RESTRICTION").describe("Age restriction for campaign")
			},
		},
		async ({ 
			adAccountId, 
			name, 
			objective, 
			fundingInstrumentId,
			configuredStatus = "ACTIVE",
			spendCap,
			goalValue,
			goalType,
			appId,
			ageRestriction = "NO_AGE_RESTRICTION"
		}) => {
			try {
				const campaign = await redditClient.createCampaign(
					adAccountId,
					name,
					objective,
					fundingInstrumentId,
					configuredStatus,
					spendCap,
					goalValue,
					goalType,
					appId,
					ageRestriction
				)
				return {
					content: [
						{
							type: "text",
							text: `Successfully created campaign: ${JSON.stringify(campaign, null, 2)}`
						},
					],
				}
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: `Error creating campaign: ${error}`,
						},
					],
					isError: true,
				}
			}
		}
	)

	server.registerTool(
		"createAdGroup",
		{
			title: "Create Ad Group",
			description: "Create a new Reddit ad group with targeting and bidding options",
			inputSchema: {
				adAccountId: z.string().describe("Reddit ad account ID"),
				campaignId: z.string().describe("Campaign ID this ad group belongs to"),
				name: z.string().describe("Ad group name"),
				configuredStatus: z.enum(["ACTIVE", "ARCHIVED", "DELETED", "PAUSED"]).default("ACTIVE").describe("Ad group status"),
				bidType: z.enum(["CPC", "CPM", "CPV", "CPV6"]).optional().describe("Bidding strategy type"),
				bidValue: z.number().min(0).optional().describe("Bid amount in microcurrency per event"),
				bidStrategy: z.enum(["BIDLESS", "MANUAL_BIDDING", "MAXIMIZE_VOLUME", "TARGET_CPX"]).optional().describe("Bid strategy"),
				goalValue: z.number().min(0).optional().describe("Goal value in microcurrency"),
				goalType: z.enum(["DAILY_SPEND", "LIFETIME_SPEND"]).optional().describe("Type of goal"),
				startTime: z.string().optional().describe("ISO 8601 timestamp when ad group starts (e.g., 2025-09-18T22:27:10Z)"),
				endTime: z.string().optional().describe("ISO 8601 timestamp when ad group ends"),
				optimizationGoal: z.enum([
					"PAGE_VISIT", "VIEW_CONTENT", "SEARCH", "ADD_TO_CART", "ADD_TO_WISHLIST", 
					"PURCHASE", "LEAD", "SIGN_UP", "CLICKS", "MOBILE_CONVERSION_INSTALL",
					"MOBILE_CONVERSION_SIGN_UP", "MOBILE_CONVERSION_ADD_PAYMENT_INFO",
					"MOBILE_CONVERSION_ADD_TO_CART", "MOBILE_CONVERSION_PURCHASE",
					"MOBILE_CONVERSION_COMPLETED_TUTORIAL", "MOBILE_CONVERSION_LEVEL_ACHIEVED",
					"MOBILE_CONVERSION_SPEND_CREDITS", "MOBILE_CONVERSION_REINSTALL",
					"MOBILE_CONVERSION_UNLOCK_ACHIEVEMENT", "MOBILE_CONVERSION_START_TRIAL",
					"MOBILE_CONVERSION_SUBSCRIBE", "MOBILE_CONVERSION_ONBOARD_STARTED",
					"MOBILE_CONVERSION_FIRST_TIME_PURCHASE"
				]).optional().describe("Optimization goal for conversions"),
				targeting: z.object({
					communities: z.array(z.string()).optional(),
					geolocations: z.array(z.string()).optional(),
					age_targeting: z.object({
						min_age: z.number().min(13).max(65).optional(),
						max_age: z.number().min(13).max(65).optional()
					}).optional()
				}).optional().describe("Targeting options"),
				appId: z.string().optional().describe("App ID for app install campaigns")
			},
		},
		async ({ 
			adAccountId, 
			campaignId, 
			name,
			configuredStatus = "ACTIVE",
			bidType,
			bidValue,
			bidStrategy,
			goalValue,
			goalType,
			startTime,
			endTime,
			optimizationGoal,
			targeting,
			appId
		}) => {
			try {
				const adGroup = await redditClient.createAdGroup(
					adAccountId,
					campaignId,
					name,
					configuredStatus,
					bidType,
					bidValue,
					bidStrategy,
					goalValue,
					goalType,
					startTime,
					endTime,
					optimizationGoal,
					targeting,
					appId
				)
				return {
					content: [
						{
							type: "text",
							text: `Successfully created ad group: ${JSON.stringify(adGroup, null, 2)}`
						},
					],
				}
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: `Error creating ad group: ${error}`,
						},
					],
					isError: true,
				}
			}
		}
	)

	server.registerTool(
		"createPost",
		{
			title: "Create Post",
			description: "Create a new Reddit post for advertising",
			inputSchema: {
				profileId: z.string().describe("Reddit profile ID (format: t2_xxxxx)"),
				type: z.enum(["CAROUSEL", "IMAGE", "TEXT", "VIDEO"]).describe("Post type"),
				headline: z.string().describe("Post title/headline"),
				allowComments: z.boolean().default(true).describe("Enable comments on the post"),
				body: z.string().max(40000).optional().describe("Text content for text posts (max 40,000 characters)"),
				thumbnailUrl: z.string().url().optional().describe("Thumbnail image URL (required for video posts)"),
				content: z.array(z.object({
					call_to_action: z.string().optional().describe("Call to action text (e.g., 'Learn More')"),
					destination_url: z.string().url().optional().describe("Destination URL when clicked"),
					display_url: z.string().optional().describe("Display URL shown to users"),
					media_url: z.string().url().optional().describe("Image/video media URL")
				})).max(6).optional().describe("Post content array (max 6 items for carousel, 1 for others)"),
				isRichtext: z.boolean().optional().describe("Whether text post body is in richtext format")
			},
		},
		async ({ 
			profileId, 
			type, 
			headline,
			allowComments = true,
			body,
			thumbnailUrl,
			content,
			isRichtext
		}) => {
			try {
				const post = await redditClient.createPost(
					profileId,
					type,
					headline,
					allowComments,
					body,
					thumbnailUrl,
					content,
					isRichtext
				)
				return {
					content: [
						{
							type: "text",
							text: `Successfully created post: ${JSON.stringify(post, null, 2)}`
						},
					],
				}
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: `Error creating post: ${error}`,
						},
					],
					isError: true,
				}
			}
		}
	)

	server.registerTool(
		"createAd",
		{
			title: "Create Reddit Ad",
			description: "Create a Reddit ad using the official Reddit Ads API",
			inputSchema: {
				adAccountId: z.string().describe("Reddit ad account ID"),
				name: z.string().min(1).max(500).describe("Ad name (1-500 characters)"),
				configuredStatus: z.enum(["ACTIVE", "ARCHIVED", "DELETED", "PAUSED"]).describe("Ad status"),
				adGroupId: z.string().optional().describe("Ad group ID this ad belongs to"),
				campaignId: z.string().optional().describe("Campaign ID this ad belongs to"),
				clickUrl: z.string().max(5000).optional().describe("Destination URL when ad is clicked (max 5000 characters)"),
				postId: z.string().regex(/^t3_.*/).optional().describe("Reddit post ID to promote (format: t3_xxxxx)"),
				campaignObjectiveType: z.enum([
					"APP_INSTALLS",
					"CATALOG_SALES",
					"CLICKS", 
					"CONVERSIONS",
					"IMPRESSIONS",
					"LEAD_GENERATION",
					"VIDEO_VIEWABLE_IMPRESSIONS"
				]).optional().describe("Campaign objective type"),
				profileId: z.string().optional().describe("Profile ID for catalog sales campaigns"),
				profileUsername: z.string().optional().describe("Profile username for catalog sales campaigns"),
				clickUrlQueryParams: z.array(z.object({
					name: z.string().describe("Query parameter name"),
					value: z.string().describe("Query parameter value")
				})).max(14).optional().describe("UTM parameters for click URL (max 14 items)"),
				eventTrackers: z.array(z.object({
					type: z.string().describe("Event type (e.g., CLICK)"),
					url: z.string().url().describe("Tracking URL")
				})).optional().describe("Event tracking pixels from approved providers"),
				shoppingCreative: z.object({
					allow_comments: z.boolean().optional(),
					call_to_action: z.string().optional(),
					destination_url: z.string().url().optional(),
					headline: z.string().optional(),
					second_line_cta: z.string().optional(),
					dpa_carousel_mode: z.string().optional()
				}).optional().describe("Shopping creative settings"),
				products: z.array(z.object({
					product_id: z.string().describe("Product ID")
				})).optional().describe("Products associated with the ad"),
				previewExpiry: z.string().optional().describe("ISO 8601 timestamp for preview URL expiry")
			},
		},
		async ({ 
			adAccountId, 
			name, 
			configuredStatus,
			adGroupId,
			campaignId,
			clickUrl, 
			postId,
			campaignObjectiveType, 
			profileId, 
			profileUsername,
			clickUrlQueryParams,
			eventTrackers,
			shoppingCreative,
			products,
			previewExpiry
		}) => {
			try {
				const ad = await redditClient.createAd(
					adAccountId,
					name,
					configuredStatus,
					adGroupId,
					campaignId,
					clickUrl,
					postId,
					campaignObjectiveType,
					profileId,
					profileUsername,
					clickUrlQueryParams,
					eventTrackers,
					shoppingCreative,
					products,
					previewExpiry
				)
				return {
					content: [
						{
							type: "text",
							text: `Successfully created ad: ${JSON.stringify(ad, null, 2)}`
						},
					],
				}
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: `Error creating ad: ${error}`,
						},
					],
					isError: true,
				}
			}
		}
	)

	server.tool(
		"getAds",
		{
			title: "Get All Ads",
			description: "Get all ads from a Reddit ad account",
			inputSchema: {
				adAccountId: z.string().describe("Reddit ad account ID")
			},
		},
		async ({ adAccountId }) => {
			try {
				const ads = await redditClient.getAds(adAccountId)
				return {
					content: [
						{
							type: "text",
							text: `Found ${ads.length} ads:\n\n${JSON.stringify(ads, null, 2)}`
						},
					],
				}
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: `Error getting ads: ${error}`,
						},
					],
					isError: true,
				}
			}
		}
	)

	server.registerTool(
		"generateImage",
		{
			title: "Generate Image",
			description: "Generate an image from a text description using Google's Gemini Flash Image Preview",
			inputSchema: {
				prompt: z.string().describe("Text description of the image to generate"),
				style: z.enum(["photorealistic", "illustration", "minimalist", "artistic"]).default("photorealistic").describe("Style of the generated image"),
			},
		},
		async ({ prompt, style = "photorealistic" }) => {
			try {
				const apiKey = process.env.GOOGLE_GEMINI_API_KEY
				
				if (!apiKey) {
					return {
						content: [
							{
								type: "text",
								text: "Google Gemini API key not configured. Please set GOOGLE_GEMINI_API_KEY environment variable.",
							},
						],
						isError: true,
					}
				}
				
				// Enhance prompt based on style
				let enhancedPrompt = prompt
				if (style === "photorealistic") {
					enhancedPrompt = `Create a photorealistic, high-quality image: ${prompt}. Ultra-realistic details, professional photography, sharp focus.`
				} else if (style === "illustration") {
					enhancedPrompt = `Create an illustrated image: ${prompt}. Digital illustration style, vibrant colors, clean lines.`
				} else if (style === "minimalist") {
					enhancedPrompt = `Create a minimalist image: ${prompt}. Simple, clean design, minimal elements, lots of negative space.`
				} else if (style === "artistic") {
					enhancedPrompt = `Create an artistic image: ${prompt}. Creative interpretation, artistic style, unique perspective.`
				}
				
				const response = await axios.post(
					`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent`,
					{
						contents: [{
							parts: [
								{
									text: enhancedPrompt
								}
							]
						}]
					},
					{
						headers: {
							'x-goog-api-key': apiKey,
							'Content-Type': 'application/json'
						}
					}
				)
				// console.log("generateImage response:", JSON.stringify(response.data, null, 2))

				if (response.data?.candidates?.[0]?.content?.parts) {
					// Find the image part in the response
					for (const part of response.data.candidates[0].content.parts) {
						if (part.inlineData?.data) {
							const mimeType = part.inlineData.mimeType || 'image/png'
							const base64Data = `data:${mimeType};base64,${part.inlineData.data}`
							
							// Upload to PostImages and return the URL
							const imageUrl = await redditClient.uploadToPostImages(base64Data)
							
							return {
								content: [
									{
										type: "text",
										text: `Successfully generated image with ${style} style.`,
									},
									{
										type: "text",
										text: JSON.stringify({ 
											image_url: imageUrl,
											upload_status: imageUrl === base64Data ? "PostImages upload failed, returned base64" : "Successfully uploaded to PostImages"
										}, null, 2),
									},
								],
							}
						}
					}
				}

				return {
					content: [
						{
							type: "text",
							text: "No image was generated in the response",
						},
					],
					isError: true,
				}
			} catch (error: any) {
				console.error("Failed to generate image:", error.response?.data || error)
				return {
					content: [
						{
							type: "text",
							text: `Error generating image: ${error.response?.data?.error?.message || error.message}`,
						},
					],
					isError: true,
				}
			}
		}
	)
	return server.server
}
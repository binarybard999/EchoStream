import { GoogleGenerativeAI } from "@google/generative-ai";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const apiKey = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
});

const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
};

/**
 * Fetch AI-generated content based on video details
 * @route POST /api/ai/generate
 * @access Public
 */
const generateAiContent = asyncHandler(async (req, res) => {
    const { title, description, tags, category } = req.body;
    console.log(req.body);
    console.log(req.body.title);
    console.log(req.body.description);
    console.log(req.body.tags);
    console.log(req.body.category);

    // Input validation
    if (!title || !description || !category) {
        res.status(400).json({
            message: "Title, description, and category are required.",
        });
        return;
    }

    const chatSession = model.startChat({
        generationConfig,
        history: [
            {
                role: "user",
                parts: [
                    {
                        text: `
    You are an AI integrated into a video-sharing platform. Your task is to receive video-related data in JSON format and generate related content based on it.
    
    The content you generate should include:
    - **Books**: Titles, authors, and purchase links (e.g., Amazon, official publishers).
    - **Links**: General-purpose, widely used, and category-specific reliable websites. Examples:
      - Official websites (e.g., https://www.fifa.com for sports, https://www.w3schools.com for coding).
      - Well-known platforms (e.g., https://www.amazon.com for products, https://www.wikipedia.org for general knowledge).
      - Reputable resources like news websites, tutorial platforms, or blogs.
    - **Recipes**: Ingredients, steps, and links to popular food websites (e.g., https://www.allrecipes.com, https://www.foodnetwork.com).
    - **Facts**: Trivia or insights about the video topic, ensuring accuracy and relevance.
    - **Products**: Items with purchase links to reputable platforms like Amazon, Nike, Adidas, or other official stores.
    - **Articles**: Titles, descriptions, and links to trusted sources like Britannica, History.com, or domain-specific blogs.
    
    ### Rules:
    1. The response **must be pure JSON**.
    2. **Do not include any comments, explanations, or unnecessary formatting**.
    3. Use general, widely applicable links to minimize the chance of 404 errors or broken pages.
    4. Leave fields empty arrays or objects if they are not relevant to the video content.
    
    ### Input Data Format:
    {
      "title": "Title of the video",
      "description": "Description of the video",
      "tags": "tag1, tag2, tag3", // Comma-separated tags
      "category": "Category of the video"
    }
    
    ### Response Format:
    {
      "data": {
        "books": [
          {
            "title": "Clean Code",
            "author": "Robert C. Martin",
            "link": "https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882"
          }
        ],
        "links": [
          {
            "title": "W3Schools",
            "description": "Online tutorials for web development.",
            "url": "https://www.w3schools.com"
          },
          {
            "title": "FIFA Official Website",
            "description": "Comprehensive sports information.",
            "url": "https://www.fifa.com"
          }
        ],
        "recipes": [
          {
            "name": "Spaghetti Carbonara",
            "ingredients": ["Spaghetti", "Eggs", "Pancetta", "Parmesan", "Black Pepper"],
            "steps": [
              "Boil the spaghetti.",
              "Cook the pancetta.",
              "Mix eggs and cheese.",
              "Combine spaghetti with pancetta and egg mixture.",
              "Serve with black pepper on top."
            ],
            "source": "https://www.allrecipes.com"
          }
        ],
        "facts": [
          "The first FIFA World Cup was held in 1930 in Uruguay.",
          "Clean Code is a widely recommended book for programmers."
        ],
        "products": [
          {
            "name": "Adidas Soccer Ball",
            "description": "Professional grade soccer ball.",
            "link": "https://www.adidas.com/us/football"
          }
        ],
        "articles": [
          {
            "title": "History of Football",
            "description": "A detailed history of the sport.",
            "url": "https://www.britannica.com/sports/association-football"
          }
        ]
      }
    }
    
    ### Key Rules for Links:
    - Links should prioritize official websites or large, well-known platforms (e.g., https://www.amazon.com, https://www.wikipedia.org).
    - Use general category links when specific ones are unavailable or unreliable.
    - Avoid deep links that are prone to breaking; prefer main pages or category-specific sections.
    - Ensure that every link points to a working and widely recognized source.
    `,
                    },
                ],
            },
        ],
    });

    try {
        const result = await chatSession.sendMessage(
            `title: ${req.body.title}\ndescription: ${req.body.description}\ntags: ${req.body.tags}\ncategory: ${req.body.category}`
        );

        const responseText = result.response
            .text()
            .replace(/```json|```/g, "")
            .trim();

        console.log(responseText);

        let aiResponseText;
        try {
            aiResponseText = JSON.parse(responseText);
        } catch (parseError) {
            throw new Error("Failed to parse AI response JSON.");
        }

        // Fallback for empty fields
        const fallbackData = {
            books: [
                {
                    title: "General Programming Guide",
                    author: "Multiple Authors",
                    link: "https://www.amazon.com/s?k=programming+books",
                },
            ],
            links: [
                {
                    title: "Wikipedia",
                    description: "A free online encyclopedia.",
                    url: "https://www.wikipedia.org/",
                },
                {
                    title: "Google",
                    description: "Search anything on the web.",
                    url: "https://www.google.com/",
                },
            ],
            recipes: [
                {
                    name: "Basic Pancake Recipe",
                    ingredients: ["Flour", "Eggs", "Milk", "Sugar"],
                    steps: [
                        "Mix the ingredients.",
                        "Heat a pan and pour batter.",
                        "Cook until golden on both sides.",
                    ],
                    source: "https://www.allrecipes.com",
                },
            ],
            facts: ["Trivia and interesting insights about the topic."],
            products: [
                {
                    name: "Amazon Gift Card",
                    description: "A great way to shop online.",
                    link: "https://www.amazon.com/gift-card",
                },
            ],
            articles: [
                {
                    title: "General Knowledge Hub",
                    description: "Learn about various topics.",
                    url: "https://www.britannica.com",
                },
            ],
        };

        const validatedResponse = {
            books:
                Array.isArray(aiResponseText.data.books) &&
                aiResponseText.data.books.length > 0
                    ? aiResponseText.data.books
                    : fallbackData.books,
            links:
                Array.isArray(aiResponseText.data.links) &&
                aiResponseText.data.links.length > 0
                    ? aiResponseText.data.links
                    : fallbackData.links,
            recipes:
                Array.isArray(aiResponseText.data.recipes) &&
                aiResponseText.data.recipes.length > 0
                    ? aiResponseText.data.recipes
                    : fallbackData.recipes,
            facts:
                Array.isArray(aiResponseText.data.facts) &&
                aiResponseText.data.facts.length > 0
                    ? aiResponseText.data.facts
                    : fallbackData.facts,
            products:
                Array.isArray(aiResponseText.data.products) &&
                aiResponseText.data.products.length > 0
                    ? aiResponseText.data.products
                    : fallbackData.products,
            articles:
                Array.isArray(aiResponseText.data.articles) &&
                aiResponseText.data.articles.length > 0
                    ? aiResponseText.data.articles
                    : fallbackData.articles,
        };

        // Check validity of links and replace invalid ones with general links
        const validUrlRegex =
            /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

        const validateLinks = (items) =>
            items.map((item) => ({
                ...item,
                url: validUrlRegex.test(item.url || item.link)
                    ? item.url || item.link
                    : "https://www.google.com/",
            }));

        validatedResponse.links = validateLinks(validatedResponse.links);
        validatedResponse.products = validateLinks(validatedResponse.products);
        validatedResponse.articles = validateLinks(validatedResponse.articles);

        res.status(200).json(
            new ApiResponse(
                200,
                { data: validatedResponse },
                "Content created successfully."
            )
        );
    } catch (error) {
        console.error("Error interacting with Gemini AI:", error.message);
        res.status(500).json(
            new ApiError(
                500,
                error.message || "Failed to fetch AI-generated content."
            )
        );
    }
});

export { generateAiContent };

// errorHandler.js - Utility for handling common music bot errors

/**
 * Handles common music bot errors and provides user-friendly messages
 * @param {Error} error - The error object
 * @returns {string} User-friendly error message
 */
export function handleMusicError(error) {
  // Common YouTube/API errors
  if (error.message.includes('status code: 403') || error.message.includes('status code: 429')) {
    return "YouTube API rate limit reached. Please try again later.";
  }
  
  if (error.message.includes('copyright') || error.message.includes('COPYRIGHT_CLAIM')) {
    return "This song cannot be played due to copyright restrictions.";
  }
  
  if (error.message.includes('private') || error.message.includes('PRIVATE_VIDEO')) {
    return "This video is private and cannot be played.";
  }
  
  if (error.message.includes('age') || error.message.includes('AGE_RESTRICTED')) {
    return "This video is age-restricted and cannot be played.";
  }
  
  // Voice connection errors
  if (error.message.includes('voice connection') || error.message.includes('VOICE_CONNECTION_ERROR')) {
    return "Failed to connect to the voice channel. Please check permissions or try again later.";
  }
  
  // Playback errors
  if (error.message.includes('audio resource') || error.message.includes('RESOURCE_ERROR')) {
    return "Failed to create audio resource. The song format may be unsupported.";
  }
  
  // Default error message
  return `An error occurred: ${error.message}`;
}

/**
 * Validates YouTube URLs
 * @param {string} url - The URL to validate
 * @returns {boolean} Whether the URL is a valid YouTube URL
 */
export function isValidYouTubeUrl(url) {
  const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
  return pattern.test(url);
}

/**
 * Formats duration from seconds to mm:ss format
 * @param {number} durationInSeconds - Duration in seconds
 * @returns {string} Formatted duration string
 */
export function formatDuration(durationInSeconds) {
  if (!durationInSeconds) return "Unknown";
  
  const minutes = Math.floor(durationInSeconds / 60);
  const seconds = Math.floor(durationInSeconds % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

/**
 * Checks if the bot has required voice channel permissions
 * @param {VoiceChannel} channel - The voice channel to check
 * @param {ClientUser} botUser - The bot's user object
 * @returns {Object} Object containing result and missing permissions
 */
export function checkVoicePermissions(channel, botUser) {
  const permissions = channel.permissionsFor(botUser);
  const required = ['Connect', 'Speak'];
  const missing = required.filter(perm => !permissions.has(perm));
  
  return {
    hasPermissions: missing.length === 0,
    missing
  };
}

/**
 * Creates a simple embed for song information
 * @param {Object} song - Song object with title, url and other properties
 * @param {string} status - Status like "Now Playing", "Added to Queue", etc.
 * @returns {Object} Discord embed object
 */
export function createSongEmbed(song, status) {
  return {
    color: 0x3498db,
    title: status,
    description: `[${song.title}](${song.url})`,
    thumbnail: song.thumbnail ? { url: song.thumbnail } : null,
    fields: [
      {
        name: 'Duration',
        value: song.duration ? formatDuration(song.duration) : 'Unknown',
        inline: true
      },
      {
        name: 'Requested By',
        value: song.requestedBy || 'Unknown',
        inline: true
      }
    ],
    footer: {
      text: '🎵 Discord Music Bot'
    }
  };
}

/**
 * Search for YouTube videos using a fallback method
 * @param {string} query - The search query
 * @returns {Promise<{title: string, url: string, thumbnail: string}>} A song object
 */
export async function searchYouTube(query) {
  const fetch = (await import('node-fetch')).default;
  
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl);
    const html = await response.text();
    
    // Extract video IDs from the HTML response
    const regex = /\/watch\?v=([a-zA-Z0-9_-]{11})/g;
    const matches = html.matchAll(regex);
    const videoIds = [...new Set([...matches].map(match => match[1]))];
    
    if (videoIds.length > 0) {
      const videoUrl = `https://www.youtube.com/watch?v=${videoIds[0]}`;
      
      // Try to get video info using ytdl
      try {
        const ytdl = (await import('ytdl-core')).default;
        const info = await ytdl.getBasicInfo(videoUrl);
        return {
          title: info.videoDetails.title,
          url: videoUrl,
          thumbnail: info.videoDetails.thumbnails?.[0]?.url
        };
      } catch (ytdlError) {
        // If ytdl fails, return basic info
        return {
          title: query,
          url: videoUrl,
          thumbnail: null
        };
      }
    }
    
    throw new Error('No videos found');
  } catch (error) {
    console.error('YouTube search fallback error:', error);
    throw error;
  }
}

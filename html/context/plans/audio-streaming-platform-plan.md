# Requested By & Method:
Geoff


# Story & Business Case (Pick 1):

User: As a user of audio streaming platforms, I would like to have more control over storing and sharing my mixes.  Platforms like mixcloud and soundcloud are cost prohibitive, have technical limitations and don't often update.   I would like to self host and create a platform for other users to co-host or self host their own mixes as well, then embed those mixes into an easily accessable site or their own sites.

Goal: Create a self hosted audio streaming platform that allows users to store, share, and embed their mixes easily.  Start by backing it myself with storage and keep it somewhat hidden to prevent DCMA takedown requests.

# Stakeholder/SME:
Geoff
 

# Acceptance Criteria:
- A set of code and components that accept a simple json data format and will then render single players or playlists based on that data
- The data format should contain:
    - For single tracks/mixes:
        - Information about each mix, including title, description, artist, and duration
        - URL or path to the audio file
        - Metadata for embedding, such as thumbnail image and embed code
        - Playlist information, if the mix is part of a collection of mixes
    - For playlists:
        - Information about the playlist, including title, description, and creator
        - A list of mixes included in the playlist
        - Metadata for embedding, such as thumbnail image and embed code

- MVP for the project
    - Component code for the player and js 
    - Example JSON data for both single mixes and playlists to demonstrate the expected format and structure
    - Instructions on how to set up the self hosting and then how to embed players on other sites
    - An admin interface to manage mixes, playlists, and user permissions that I will host
        - Displays all added mixes and playlists
        - Allows sorting and filtering based in simple criteria
        - Allows users to add, edit, and remove mixes and playlists
        - Uploading mixes stores them in my storage system and processes them as needed to play
        - Manages user permissions for accessing and modifying content

    - Unknowns:
        - Should the admin interface have an API
        - How should authentication work in the MVP - perhaps no user layer, just me only with a simple password or token-based access
            - I could integrate with arcane city?  Not sure


Potential Solution:
    - Use cloudflareR2 for storage and streaming of audio files, as it offers a cost-effective and scalable solution for hosting media content.
      - Set up R2 account with cloudflare 2026.04.22
        - account id: efb39a38ad5c29224095d417e889a83f
        - s3 api: https://efb39a38ad5c29224095d417e889a83f.r2.cloudflarestorage.com
        - offgrid-dev
      - Consider how to set up the bucket structure 
        - offgrid-dev

Breaking Changes:



Documentation:

 

Automated Testing Criteria:

 
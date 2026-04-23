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
        - Finalize the design, functionality and features of the player, including play/pause, seek, volume control, and playlist navigation
    - Example JSON data for both single mixes and playlists to demonstrate the expected format and structure
    - Instructions on how to set up the self hosting and then how to embed players on other sites
    - Build database schema to store mixes, playlists, and user information
    - Should I store other meta data for mixes in github? Ex: path to file, soundcloud path. Tags, release date, contact info?
    - Build backend API to manage mixes and playlists, including CRUD operations *This can be after the MVP
    - An admin interface to manage mixes, playlists, and user permissions that I will host
        - Allows users to add, edit, and remove mixes and playlists
        - Uploading mixes stores them in my storage system and processes them as needed to play
        - Manages user permissions for accessing and modifying content
    - Displays all added mixes and playlists
        - Allows sorting and filtering based in simple criteria

    - Unknowns:
        - Should the admin interface have an API
        - How should authentication work in the MVP - perhaps no user layer, just me only with a simple password or token-based access
            - I could integrate with arcane city?  Not sure

Potential Solution:
    - Use cloudflareR2 for storage and streaming of audio files, as it offers a cost-effective and scalable solution for hosting media content.
      - Set up R2 account with cloudflare 2026.04.22
        - account id: efb39a38ad5c29224095d417e889a83f
        - s3 api: https://efb39a38ad5c29224095d417e889a83f.r2.cloudflarestorage.com
        - bucket: offgrid-dev
      - Consider how to set up the bucket structure 
        - offgrid-dev
    - Use a simple JSON format to define mixes and playlists, which can be easily parsed by the frontend player component.
    ```
    <cutups-player
    src="https://cdn.example.com/mix.mp3"
    title="My Mix"
    artist="DJ Name"
    thumb="https://cdn.example.com/cover.jpg"
    peaks="https://cdn.example.com/mix.peaks.json"
    color="#ff5500"
    tags="jungle, breakcore, hardcore">
    </cutups-player>
    ```

Documentation:
    - as each step is accepted, build usable documentation
 

Automated Testing Criteria:
    - always include testing
 
# Additional brainstorming
- I would like to change the admin page so i don't have to provide the API and bucket information to log in.  I could have a config file that is read by the admin page and then use that to connect to the API and storage.  This would allow me to keep the API and bucket information hidden and only accessible to me.  I'd still like some form of auth on the admin page.  Maybe just an admin u/p for now.  In the future I'd like to convert it so that different users and log in, have their own page, and when uploads happen, it stores the user information with the mix.
- On upload, instead of requiring a peaks file, have the backend process and create the peaks file and then store it in the same location as the audio file.  This would make it easier for users to upload mixes without needing to generate a peaks file themselves.  It would also allow me to control the format of the peaks file and ensure that it is consistent across all mixes.
- An additional feature for each mix - allow relation to the storage of the tracklist.  This is often in the description, but I'd like it to be explicitly included, and processed like in my mix-extraction project.  This would split each track into artist, title and label, and allow for enrichment.  An additional mix-extraction step would then fill in missing data, and find paths to the artist and or label page, and direct links to bandcamp and or soundcloud.  I'd like to then automatically build the "buymusic.club" style page for each mix with links to each track and individual players.  This would allow users to check out my mixes and then easily go buy the tracks too.


# Next steps:
- Although I'd like to use this code code in a project like this, it seems like it would be better to move into it's own project that I can deploy seperately?
- What would that look like?  A simple node server with a react frontend?  Or just a static site with a js player and then a separate admin interface?
- I already have the player page and admin page in /audio in this project
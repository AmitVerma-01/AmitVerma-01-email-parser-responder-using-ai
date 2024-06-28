# Email Parser Using AI

## Project Description

The Email Parser Using AI is a tool designed to streamline email management by automating the process of labeling and responding to emails. By granting access to your Gmail account, this tool reads the email content, generates a label based on the email body, and assigns it accordingly. Additionally, it generates a reply to the email and sends it back to the sender. This project leverages the Gemini API for generating labels and replies and the Gmail API for email processing.

## Features

- Automatically labels incoming emails based on their content.
  - Labels assigned:
    - Interested
    - Not Interested
    - More Information
- Generates and sends replies to emails.
- Utilizes the Gemini API for AI-driven label and reply generation.
- Integrates with the Gmail API for email processing.
- Manages task scheduling using BullMQ.
- Repeats the email processing every 15 minutes.


## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/your-username/email-parser-using-ai.git
    cd email-parser-using-ai
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Set up environment variables:
    - Create a `.env` file in the root directory of the project.
    - Add the following environment variable:
        ```
        GEMINI_API_KEY=your_gemini_api_key
        ```

4. Download the `credentials.json` file from the Google Cloud Console and place it in the root directory of the project.

## Usage

1. Start the application:
    ```bash
    node main.js
    ```

2. The application will begin processing your emails, generating labels, and sending replies automatically.

## Contribution Guidelines

We welcome contributions from the community! Please follow these steps to contribute:

1. Fork the repository.
2. Create a new branch:
    ```bash
    git checkout -b feature/your-feature-name
    ```
3. Make your changes.
4. Commit your changes:
    ```bash
    git commit -m 'Add some feature'
    ```
5. Push to the branch:
    ```bash
    git push origin feature/your-feature-name
    ```
6. Open a pull request.

## Contact

If you have any questions or need further assistance, feel free to reach out:

- Email: amitverma.dev01@gmail.com
- GitHub: [AmitVerma-01](https://github.com/AmitVerma-01)

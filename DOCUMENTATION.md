# Bookstore Application Guide

Welcome! This guide gives you a complete overview of your Bookstore application, explaining its features and how to use them.

## 1. What is this Application?

This application is your complete online bookstore. It includes a beautiful storefront for your customers to browse and buy books, and a private dashboard for you to manage everything behind the scenes.

## 2. Where to Find Things

The code is organized into a few main areas. You don't need to know this to use the app, but it can be helpful for developers:

-   **/src/app**: This is the heart of the application.
    -   **/src/app/(storefront)/**: Contains all the pages for your customer-facing store.
    -   **/src/app/login**: The login page for you to access the dashboard.
    -   **/src/app/page.tsx**: The main dashboard page where you'll land after logging in.
-   **/src/components**: Reusable pieces of the website, like buttons and forms.
-   **/src/ai**: The code for the Artificial Intelligence features.
-   **/src/lib**: Important helper functions and type definitions.
-   **/src/emails**: The templates for emails sent to your customers.
-   **/public**: Static files like your logo.

## 3. Summary of Features

### Your Admin Dashboard (The Control Panel)

This is your private area to run the bookstore.

-   **Overview**: Your command center. See a snapshot of your total revenue, sales, number of customers, and your best-selling book. It also shows a sales chart and your most recent orders.
-   **Orders Management**: View and manage all customer orders. You can update an order's status (e.g., from "Processing" to "Shipped") and add a tracking link for physical books, which will be automatically emailed to the customer.
-   **Books Management**: Your library. Add new books, edit existing ones, or remove them. You can upload book covers and even add digital or extra files (like workbooks or audio) for your customers.
-   **Customers Management**: See a list of all your customers, how many orders they've made, and how much they've spent.
-   **Banners Management**: Create beautiful promotional banners for your store's homepage. You can link these banners directly to a book and even use AI to write catchy marketing text for you.
-   **Settings**: Adjust your store's settings, like changing the currency (e.g., from USD to ZAR) or setting the company email address that receives order notifications.

### The Storefront (What Your Customers See)

This is the public website where customers shop.

-   **Homepage**: The front door to your store. It features your promotional banners and a selection of featured books.
-   **All Books Page**: A gallery of every book you have for sale.
-   **Book Detail Page**: A dedicated page for each book with its description, price, and customer reviews. Customers can read a sample of the book here and click "Buy Now" to purchase it.
-   **Share Feature**: Customers can easily share a link to a book's page on social media or by copying the link.
-   **Checkout Process**: A simple and secure way for customers to pay. They can choose between physical and digital versions of a book (if you've provided both) and will receive a confirmation email after their purchase.

### AI-Powered Features

-   **Banner Content Generation**: When you're creating a promotional banner, click the "Generate with AI" button, and the system will write a title and description for you based on the book you've selected.

### Security

-   **Secure Admin Login**: Your dashboard is protected by a username and password, so only you can access it.

## 4. For Developers: Getting Started

This section is for technical users who want to run the application on their own computer.

1.  **Environment Variables**: Create a `.env` file in the main project folder and add the necessary secret keys for Firebase and Paystack.
2.  **Install Dependencies**: Run `npm install` in your terminal.
3.  **Run the App**: Run `npm run dev`. Your store will be available at `http://localhost:3000/store`, and your admin dashboard at `http://localhost:3000`.

## 5. Technology Used

This is a list of the key technologies used to build the application:

-   **Next.js**: The main framework for the website.
-   **Firebase**: Used for the database, user logins, and file storage.
-   **Tailwind CSS**: For all the styling.
-   **ShadCN**: A library of user interface components.
-   **Genkit**: Powers the AI features.
-   **Paystack**: For processing payments securely.
-   **Nodemailer & React Email**: For creating and sending emails.

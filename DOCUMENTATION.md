# Bookstore Application Documentation

Welcome to the comprehensive documentation for your Bookstore application. This document provides a complete overview of the system, its features, and how to navigate the codebase.

## 1. Introduction

This application is a full-stack e-commerce platform for selling books, complete with a customer-facing storefront and a powerful admin dashboard for managing products, orders, and customers. It's built with Next.js, Firebase, and Tailwind CSS, and includes AI-powered features to streamline marketing efforts.

## 2. Project Structure

The codebase is organized into several key directories:

-   **/src/app**: The core of the Next.js application, using the App Router.
    -   **/src/app/(storefront)/**: Contains all pages for the customer-facing store.
    -   **/src/app/api/**: API routes for handling server-side logic, such as payment processing.
    -   **/src/app/login**: The login page for administrators.
    -   **/src/app/page.tsx**: The main dashboard page.
-   **/src/components**: Reusable React components used throughout the application.
    -   **/src/components/dashboard/**: Components specific to the admin dashboard.
    -   **/src/components/store/**: Components specific to the storefront.
    -   **/src/components/ui/**: General-purpose UI components from ShadCN.
-   **/src/ai**: Contains all AI-related logic, powered by Genkit.
    -   **/src/ai/flows/**: Defines the AI flows for tasks like content generation.
-   **/src/lib**: Core libraries, utility functions, and configurations.
    -   **/src/lib/firebase.ts**: Firebase initialization and configuration.
    -   **/src/lib/types.ts**: TypeScript type definitions for the application's data structures.
-   **/src/emails**: Email templates for order confirmations, shipping notifications, and digital delivery.
-   **/public**: Static assets, such as images and logos.

## 3. Features Summary

### Admin Dashboard

The dashboard provides a centralized location for managing all aspects of the bookstore.

-   **Overview**: A summary of key metrics, including total revenue, sales, customer count, and the best-selling book. It also features a sales chart and a list of recent orders.
-   **Orders Management**: View, filter, and manage all customer orders. You can update shipping statuses, and for physical products, you can add a tracking URL that will be automatically emailed to the customer.
-   **Books Management**: A comprehensive interface for managing your book catalog. You can add, edit, and delete books, upload cover images, and manage digital and supplementary files.
-   **Customers Management**: View a list of all registered customers, including their order history and total spending.
-   **Banners Management**: Create and manage promotional banners for the storefront homepage. You can link banners to specific books and use AI to generate compelling marketing copy.
-   **Settings**: Configure store settings, such as the currency and the company email address for receiving order notifications.

### Storefront

The public-facing website where customers can browse and purchase books.

-   **Homepage**: A welcoming landing page that showcases featured books and promotional banners.
-   **All Books Page**: A gallery of all available books, allowing customers to browse the entire catalog.
-   **Book Detail Page**: A dedicated page for each book with a detailed description, customer reviews, sample text, and a "Buy Now" button.
-   **Share Feature**: Customers can easily share a link to a book page via social media or by copying the link.
-   **Checkout Process**: A secure, multi-step checkout process powered by Paystack. Customers can choose between physical and digital formats (if available) and receive confirmation emails upon successful payment.

### AI-Powered Features

-   **Banner Content Generation**: When creating a promotional banner, you can use the "Generate with AI" feature to automatically create a title and description based on the selected book's details.

### Authentication

-   **Secure Admin Login**: The dashboard is protected by Firebase Authentication, ensuring that only authorized administrators can access it.

## 4. Getting Started

To run the application locally, you will need to set up your environment variables.

1.  **Environment Variables**: Create a `.env` file in the root of the project and add the necessary Firebase and Paystack API keys.
2.  **Install Dependencies**: Run `npm install` to install all required packages.
3.  **Run the Development Server**: Run `npm run dev` to start the application. The storefront will be accessible at `http://localhost:3000/store`, and the admin dashboard at `http://localhost:3000`.

## 5. Key Technologies

-   **Next.js**: The core React framework for building the application.
-   **Firebase**: Used for the database (Firestore), authentication, and file storage.
-   **Tailwind CSS**: For styling the user interface.
-   **ShadCN**: A collection of UI components for building the dashboard and storefront.
-   **Genkit**: Powers the AI features, such as content generation.
-   **Paystack**: The payment gateway for processing transactions.
-   **Nodemailer**: For sending transactional emails.
-   **React Email**: For creating beautiful, responsive email templates.

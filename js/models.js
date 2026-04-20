/**
 * Data Models for E-Study Profile
 * Matches the Firestore structure provided in screenshots
 */

export class NotificationModel {
    constructor(data = {}) {
        // Preserving typos from database screenshot: 'course_anouncements', 'recieve_email_updates'
        this.course_anouncements = data.course_anouncements ?? false;
        this.lesson_reminders = data.lesson_reminders ?? false;
        this.new_messages = data.new_messages ?? false;
        this.progress_report = data.progress_report ?? false;
        this.recieve_email_updates = data.recieve_email_updates ?? false;
    }

    toFirestore() {
        return {
            course_anouncements: this.course_anouncements,
            lesson_reminders: this.lesson_reminders,
            new_messages: this.new_messages,
            progress_report: this.progress_report,
            recieve_email_updates: this.recieve_email_updates
        };
    }
}

export class PersonalDetailsModel {
    constructor(data = {}) {
        this.address = data.address || "";
        this.city = data.city || "";
        this.country = data.country || "Bangladesh";
        this.state = data.state || "";
        this.zip = data.zip || "";
        this.phone = data.phone || "";
        this.gender = data.gender || "";
        this.location = data.location || "";
    }

    toFirestore() {
        return {
            address: this.address,
            city: this.city,
            country: this.country,
            state: this.state,
            zip: this.zip,
            phone: this.phone,
            gender: this.gender,
            location: this.location
        };
    }
}

export class PrivacyModel {
    constructor(data = {}) {
        this.active_status = data.active_status ?? false;
        this.profile_private = data.profile_private ?? false;
        this.messages = data.messages ?? true; // Default to true based on UI
    }

    toFirestore() {
        return {
            active_status: this.active_status,
            profile_private: this.profile_private,
            messages: this.messages
        };
    }
}

export class UserModel {
    constructor(data = {}) {
        this.email = data.email || "";
        this.first_name = data.first_name || "";
        this.last_name = data.last_name || "";
        this.role = data.role || "student";
        this.notification = new NotificationModel(data.notification || {});
        this.personal_details = new PersonalDetailsModel(data.personal_details || {});
        this.privacy = new PrivacyModel(data.privacy || {});
    }

    // Helper to get full name for UI
    get fullName() {
        if (!this.first_name && !this.last_name) return "";
        return `${this.first_name} ${this.last_name}`.trim();
    }

    // Static helper to split name into first and last
    static splitName(fullName) {
        const parts = fullName.trim().split(/\s+/);
        const first_name = parts[0] || "";
        const last_name = parts.slice(1).join(" ") || "";
        return { first_name, last_name };
    }

    toFirestore() {
        return {
            email: this.email,
            first_name: this.first_name,
            last_name: this.last_name,
            role: this.role,
            notification: this.notification.toFirestore(),
            personal_details: this.personal_details.toFirestore(),
            privacy: this.privacy.toFirestore()
        };
    }
}

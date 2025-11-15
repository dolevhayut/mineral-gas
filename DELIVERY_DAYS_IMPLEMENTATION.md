# Delivery Days Implementation Summary

## Overview
The date picker has been replaced with a weekday-based delivery day selector. Customers can now only select from configured weekdays when their city is available for delivery. The system automatically calculates the next occurrence of the selected weekday as the delivery date.

## Key Features

### For Customers
- **City-Based Availability**: Customers see only weekdays when their city is configured for delivery
- **No Same-Day Selection**: Customers cannot select today's weekday (only tomorrow onwards)
- **Automatic Date Calculation**: When a weekday is selected, the system automatically calculates the next occurrence date
- **Visual Feedback**: Selected day is highlighted with the calculated delivery date displayed

### For Admins
- **Delivery Days Management**: New admin page to configure which cities receive delivery on which days
- **Multi-City Selection**: Each weekday can have multiple cities assigned
- **Real-Time City List**: Automatically fetches unique cities from the customers database
- **Easy Configuration**: Checkbox interface for quick city assignment per day

## Implementation Details

### Database Changes
1. **New Table**: `delivery_days`
   - `id` (UUID, primary key)
   - `day_of_week` (integer, 0-6 where Sunday=0)
   - `cities` (text array)
   - `created_at` and `updated_at` timestamps
   - Unique constraint on `day_of_week`
   - RLS policies enabled

### Files Created
1. **`sql/create_delivery_days_table.sql`** - Database migration script
2. **`src/lib/deliveryDays.ts`** - Utility functions for delivery days logic
3. **`src/components/order/DaySelector.tsx`** - New day selector component
4. **`src/pages/Admin/DeliveryDays.tsx`** - Admin page for managing delivery days

### Files Modified
1. **`src/integrations/supabase/types.ts`** - Added delivery_days table types
2. **`src/components/order/OrderSummary.tsx`** - Updated to use DaySelector
3. **`src/pages/orders/OrderSummaryPage.tsx`** - Added DaySelector and validation
4. **`src/App.tsx`** - Added route for delivery days admin page
5. **`src/pages/Admin/AdminLayout.tsx`** - Added menu item for delivery days

## Important: City Data Source

**Cities are NOT stored in the database!** They are fetched dynamically from the Israeli Government Open Data API:

- **API URL**: `https://data.gov.il/api/3/action/datastore_search?resource_id=5c78e9fa-c2e2-4771-93ff-7f400a12f7ba&limit=2000`
- **Filtered by**: Northern districts only (עכו, יזרעאל, צפת, כנרת, גולן, חיפה)
- **Field**: `שם_ישוב` (city/settlement name)

This means:
- Cities are always up-to-date from the government database
- No need to maintain a city list in your database
- Only the **selected city** is stored in each customer's profile
- The admin delivery days page fetches the full city list from the API on page load
- Same API is used in `EditProfile.tsx` and `ServiceRequest.tsx`

## Setup Instructions

### 1. Database Setup
Run the SQL migration to create the delivery_days table:

```bash
# Using Supabase CLI
supabase migration new create_delivery_days_table
# Copy contents from sql/create_delivery_days_table.sql to the migration file
supabase db push

# Or run directly in Supabase SQL Editor
# Copy and paste contents of sql/create_delivery_days_table.sql
```

### 2. Initial Configuration
1. Log in to the admin panel
2. Navigate to "ימי אספקה" (Delivery Days) in the admin menu
3. For each day of the week:
   - Check the cities that should receive delivery on that day
   - Click "שמור הגדרות" (Save Settings) to save configuration

### 3. Customer Requirements
Customers must have their city field populated in their profile. If a customer's city is not set:
- They will see a warning message
- They cannot select a delivery day
- They should update their profile settings

## Business Logic

### Day Selection Rules
1. **Work Days Only**: Deliveries operate Sunday through Friday only (no Saturday deliveries)
2. **Operating Hours**: Deliveries are made between 08:00-16:00 on work days
3. **Today is Excluded**: If today is Sunday, customers cannot select Sunday (only Monday onwards)
4. **Next Occurrence**: When a day is selected, the system calculates the next occurrence:
   - If today is Sunday and customer selects Wednesday → next Wednesday
   - If today is Sunday and customer selects Monday → tomorrow (Monday)
5. **City-Based Filtering**: Only days configured for the customer's city are shown

### Example Configuration
```
Sunday: Tel Aviv, Holon, Bat Yam
Monday: Jerusalem, Modiin
Tuesday: Haifa, Krayot
Wednesday: Netanya, Herzliya
Thursday: Beer Sheva, Ashkelon
Friday: Eilat
Saturday: (No deliveries)
```

With this configuration:
- A customer from Tel Aviv will only see Sunday as an option
- A customer from Jerusalem will only see Monday as an option
- A customer from Haifa will only see Tuesday as an option
- Unless it's the same day (then they see next week's occurrence)

## API Functions

### Customer-Facing Functions
```typescript
// Get available delivery days for a city
getAvailableDaysForCity(city: string): Promise<number[]>

// Calculate next occurrence of a weekday
getNextWeekdayDate(dayOfWeek: number): Date

// Get Hebrew day name
getHebrewDayName(dayOfWeek: number): string

// Format date with Hebrew day
formatDateWithHebrewDay(date: Date): string
```

### Admin Functions
```typescript
// Get all delivery day configurations
getAllDeliveryDays(): Promise<DeliveryDay[]>

// Save delivery day configuration
saveDeliveryDay(dayOfWeek: number, cities: string[]): Promise<boolean>

// Delete delivery day configuration
deleteDeliveryDay(dayOfWeek: number): Promise<boolean>
```

## Testing Checklist

### Customer Flow
- [ ] Customer can see only their city's configured days
- [ ] Customer cannot select today's weekday
- [ ] Selected day shows correct calculated date
- [ ] Order submission includes correct target_date
- [ ] Customer without city sees error message
- [ ] Customer with city not in config sees appropriate message

### Admin Flow
- [ ] Admin can access "ימי אספקה" page
- [ ] Cities list is populated from customers table
- [ ] Can check/uncheck cities for each day
- [ ] Changes are saved to database
- [ ] Configuration persists across sessions
- [ ] Multiple cities can be selected per day

### Edge Cases
- [ ] Customer switches cities (profile update)
- [ ] Admin removes customer's city from a day
- [ ] No days configured (customer sees appropriate message)
- [ ] All 7 days configured for a city
- [ ] System works correctly near midnight

## Rollback Plan

If issues arise, you can rollback by:

1. **Temporary Fix**: In `DaySelector.tsx`, add a fallback to show all days:
```typescript
// Temporarily show all days if config fails
if (availableDays.length === 0) {
  setAvailableDays([0, 1, 2, 3, 4, 5, 6]);
}
```

2. **Full Rollback**: 
   - Restore `DateSelector.tsx` from git history
   - Revert changes to `OrderSummary.tsx` and `OrderSummaryPage.tsx`
   - Remove admin route and menu item

## Future Enhancements

Potential improvements for future versions:
1. **Time Slots**: Add specific time slots per city per day
2. **Capacity Management**: Limit orders per day/city
3. **Holiday Management**: Disable delivery on holidays
4. **Notification System**: Alert admins when day capacity is reached
5. **Bulk Import**: Import city configurations from CSV
6. **Historical Analytics**: Track delivery day preferences and patterns

## Support

For issues or questions:
- Check customer city is set in their profile
- Verify delivery days are configured in admin panel
- Check browser console for error messages
- Review Supabase logs for database issues


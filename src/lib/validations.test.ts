import { bookingSchema, loginSchema } from './validations';
import { addDays, format } from 'date-fns';

describe('Validation Schemas', () => {

    describe('bookingSchema', () => {

        // Provide a valid base object that we can tweak across tests
        const validBookingData = {
            clientName: 'Israel Israeli',
            clientPhone: '0501234567',
            manufacturerId: 1, // Number or String that coerces to number
            modelId: 2,
            racquetCount: 1,
            urgency: 'Standard',
            dueDate: format(addDays(new Date(), 3), "yyyy-MM-dd"),
        };

        it('should successfully validate correct data', () => {
            const result = bookingSchema.safeParse(validBookingData);
            expect(result.success).toBe(true);
        });

        it('should coerce string IDs to numbers correctly', () => {
            const result = bookingSchema.safeParse({
                ...validBookingData,
                manufacturerId: '5', // Passed as string from form selects
                modelId: '12',
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.manufacturerId).toBe(5);
                expect(result.data.modelId).toBe(12);
            }
        });

        describe('Client Name Validation', () => {
            it('should fail if name is missing', () => {
                const result = bookingSchema.safeParse({ ...validBookingData, clientName: undefined });
                expect(result.success).toBe(false);
            });

            it('should fail if name is less than 2 characters', () => {
                const result = bookingSchema.safeParse({ ...validBookingData, clientName: 'A' });
                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.issues[0].message).toContain('שם מלא חייב להכיל לפחות 2 תווים');
                }
            });
        });

        describe('Phone Number Validation', () => {
            it('should reject non-Israeli prefixes', () => {
                const result = bookingSchema.safeParse({ ...validBookingData, clientPhone: '0301234567' });
                expect(result.success).toBe(false);
            });

            it('should reject short numbers', () => {
                const result = bookingSchema.safeParse({ ...validBookingData, clientPhone: '050123456' });
                expect(result.success).toBe(false);
            });

            it('should reject long numbers', () => {
                const result = bookingSchema.safeParse({ ...validBookingData, clientPhone: '05012345678' });
                expect(result.success).toBe(false);
            });

            it('should reject letters mixed in the string', () => {
                const result = bookingSchema.safeParse({ ...validBookingData, clientPhone: '05012a4567' });
                expect(result.success).toBe(false);
            });
        });

        describe('Dropdown/Enum Requirements', () => {
            it('should require an urgency value from the enum list', () => {
                const result = bookingSchema.safeParse({ ...validBookingData, urgency: 'SuperFast' });
                expect(result.success).toBe(false);
            });

            it('should require a manufacturer', () => {
                const result = bookingSchema.safeParse({ ...validBookingData, manufacturerId: 0 }); // Min is 1
                expect(result.success).toBe(false);
            });
        });
    });

    describe('loginSchema', () => {
        it('should validate with valid id and password', () => {
            const result = loginSchema.safeParse({ stringerId: 1, password: 'password123' });
            expect(result.success).toBe(true);
        });

        it('should enforce coerced stringerId selection', () => {
            const result = loginSchema.safeParse({ stringerId: '0', password: 'password123' });
            expect(result.success).toBe(false); // Min is 1
        });

        it('should reject empty passwords', () => {
            const result = loginSchema.safeParse({ stringerId: 1, password: '' });
            expect(result.success).toBe(false);
        });
    });

});

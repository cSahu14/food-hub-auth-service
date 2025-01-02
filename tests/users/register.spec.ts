import request from 'supertest'
import app from '../../src/app'
describe('POST auth/register', () => {
    describe('Given all fields', () => {
        it('Should return the 201 status code', async () => {
            // Arrange

            const userData = {
                firstName: 'Chidananda',
                lastName: 'Sahu',
                email: 'sahuchidananda1999@gmail.com',
                password: 'admin',
            }
            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)
            // Assert

            expect(response.statusCode).toBe(201)
        })
        it('Should return valid json response', async () => {
            // Arrange

            const userData = {
                firstName: 'Chidananda',
                lastName: 'Sahu',
                email: 'sahuchidananda1999@gmail.com',
                password: 'admin',
            }
            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)
            // Assert

            expect(
                (response.headers as Record<string, string>)['content-type'],
            ).toEqual(expect.stringContaining('json'))
        })

        it('Should persist the user when created', async () => {
            // Arrange

            const userData = {
                firstName: 'Chidananda',
                lastName: 'Sahu',
                email: 'sahuchidananda1999@gmail.com',
                password: 'admin',
            }
            // Act
            await request(app).post('/auth/register').send(userData)
            // Assert
        })
    })
    describe('/Fields are missing.', () => {})
})

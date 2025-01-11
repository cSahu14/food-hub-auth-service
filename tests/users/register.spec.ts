import request from 'supertest'
import app from '../../src/app'
import { DataSource } from 'typeorm'
import { AppDataSource } from '../../src/config/data-source'
import { Roles } from '../../src/constants'
import { User } from '../../src/entity/User'
describe('POST auth/register', () => {
    let connection: DataSource
    beforeAll(async () => {
        connection = await AppDataSource.initialize()
    })

    beforeEach(async () => {
        await connection.dropDatabase()
        await connection.synchronize()
    })

    afterAll(async () => {
        await connection.destroy()
    })
    describe('Given all fields', () => {
        it('Should return the 201 status code', async () => {
            // Arrange

            const userData = {
                firstName: 'Chidananda',
                lastName: 'Sahu',
                email: 'sahuchidananda1999@gmail.com',
                password: 'secret',
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
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(users).toHaveLength(1)
            expect(users[0].firstName).toBe(userData.firstName)
            expect(users[0].lastName).toBe(userData.lastName)
            expect(users[0].email).toBe(userData.email)
        })
        it('Should return id of created user', async () => {
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

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(users[0]).toHaveProperty('id')
        })

        it('Should assign a customer role.', async () => {
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

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(users[0]).toHaveProperty('role')
            expect(users[0].role).toBe(Roles.CUSTOMER)
        })

        it('Should store the hashed password in database.', async () => {
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
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(users[0].password).not.toBe(userData.password)
            expect(users[0].password).toHaveLength(60)
            expect(users[0].password).toMatch(/^\$2b\$\d+\$/)
        })

        it('Should return 400 status code if email is alreay exist.', async () => {
            // Arrange

            const userData = {
                firstName: 'Chidananda',
                lastName: 'Sahu',
                email: 'sahuchidananda1999@gmail.com',
                password: 'admin',
            }

            const userRepository = connection.getRepository(User)
            await userRepository.save({ ...userData, role: Roles.CUSTOMER })

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            const users = await userRepository.find()

            // Assert
            expect(response.statusCode).toBe(400)
            expect(users).toHaveLength(1)
        })
    })
    describe('/Fields are missing.', () => {})
})

import request from 'supertest'
import app from '../../src/app'
import { DataSource } from 'typeorm'
import { AppDataSource } from '../../src/config/data-source'
import { Roles } from '../../src/constants'
import { User } from '../../src/entity/User'
import { isJwt } from '../utils'
import { RefreshToken } from '../../src/entity/RefreshToken'
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
                password: 'secret123',
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
                password: 'secret123',
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
                password: 'secret123',
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
                password: 'secret123',
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
                password: 'secret123',
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
                password: 'secret123',
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
                password: 'secret123',
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

        it('Should return the access token and refresh token inside a cookie.', async () => {
            // Arrange

            const userData = {
                firstName: 'Chidananda',
                lastName: 'Sahu',
                email: 'sahuchidananda1999@gmail.com',
                password: 'secret123',
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            // Assert
            interface Headers {
                ['set-cookie']: string[]
            }
            let accessToken = null
            let refreshToken = null
            const cookies =
                (response.headers as unknown as Headers)['set-cookie'] || []
            cookies.forEach((cookie) => {
                if (cookie.startsWith('accessToken=')) {
                    accessToken = cookie.split(';')[0].split('=')[1]
                }

                if (cookie.startsWith('refreshToken=')) {
                    refreshToken = cookie.split(';')[0].split('=')[1]
                }
            })
            expect(accessToken).not.toBeNull()
            expect(refreshToken).not.toBeNull()
            expect(isJwt(accessToken)).toBeTruthy()
            expect(isJwt(refreshToken)).toBeTruthy()
        })

        it('Should store refresh token inside database.', async () => {
            // Arrange

            const userData = {
                firstName: 'Chidananda',
                lastName: 'Sahu',
                email: 'sahuchidananda1999@gmail.com',
                password: 'secret123',
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            // Assert
            const refreshTokenRepo = connection.getRepository(RefreshToken)
            // const refreshTokens = await refreshTokenRepo.find();

            const refreshTokens = await refreshTokenRepo
                .createQueryBuilder('refreshToken')
                .where('refreshToken.userId = :userId', {
                    userId: (response.body as Record<string, string>).id,
                })
                .getMany()
            expect(refreshTokens).toHaveLength(1)
        })
    })
    describe('Fields are missing.', () => {
        it('Should return 400 status code if email field is missing.', async () => {
            // Arrange

            const userData = {
                firstName: 'Chidananda',
                lastName: 'Sahu',
                email: '',
                password: 'secret123',
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)
            // Assert
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(response.statusCode).toBe(400)
            expect(users).toHaveLength(0)
        })

        it('Should return 400 status code if firstName is missing.', async () => {
            // Arrange

            const userData = {
                firstName: '',
                lastName: 'Sahu',
                email: 'sahuchidananda1999@gmail.com',
                password: 'secret123',
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)
            // Assert
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(response.statusCode).toBe(400)
            expect(users).toHaveLength(0)
        })

        it('Should return 400 status code if lastName is missing.', async () => {
            // Arrange

            const userData = {
                firstName: 'Chidananda',
                lastName: '',
                email: 'sahuchidananda1999@gmail.com',
                password: 'secret123',
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)
            // Assert
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(response.statusCode).toBe(400)
            expect(users).toHaveLength(0)
        })

        it('Should return 400 status code if password is missing.', async () => {
            // Arrange

            const userData = {
                firstName: 'Chidananda',
                lastName: 'Sahu',
                email: 'sahuchidananda1999@gmail.com',
                password: '',
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)
            // Assert
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(response.statusCode).toBe(400)
            expect(users).toHaveLength(0)
        })

        it('Should return an array of error messages if email is missing.', async () => {
            // Arrange

            const userData = {
                firstName: 'Chidananda',
                lastName: 'Sahu',
                email: '',
                password: 'secret123',
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)
            // Assert
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            expect(Array.isArray(response.body.errors)).toBe(true)
            expect(users).toHaveLength(0)
        })
    })
    describe('Fields are not in proper format', () => {
        it('Should trim the email field.', async () => {
            // Arrange

            const userData = {
                firstName: 'Chidananda',
                lastName: 'Sahu',
                email: ' sahuchidananda1999@gmail.com ',
                password: 'secret123',
            }

            // Act
            await request(app).post('/auth/register').send(userData)
            // Assert
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            const user = users[0]
            expect(user.email).toBe('sahuchidananda1999@gmail.com')
        })

        it('Should trim the firstName field.', async () => {
            // Arrange

            const userData = {
                firstName: ' Chidananda ',
                lastName: 'Sahu',
                email: 'sahuchidananda1999@gmail.com',
                password: 'secret123',
            }

            // Act
            await request(app).post('/auth/register').send(userData)
            // Assert
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            const user = users[0]
            expect(user.firstName).toBe('Chidananda')
        })

        it('Should trim the lastName field.', async () => {
            // Arrange

            const userData = {
                firstName: 'Chidananda',
                lastName: ' Sahu ',
                email: 'sahuchidananda1999@gmail.com',
                password: 'secret123',
            }

            // Act
            await request(app).post('/auth/register').send(userData)
            // Assert
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            const user = users[0]
            expect(user.lastName).toBe('Sahu')
        })

        it('Should return 400 status code if password length is less than 8 character.', async () => {
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
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(response.statusCode).toBe(400)
            expect(users).toHaveLength(0)
        })
    })
})

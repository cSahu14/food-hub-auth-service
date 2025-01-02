import app from './src/app'
import { calculateDiscount } from './src/utils'
import request from 'supertest'

describe.skip('App', () => {
    it('should return correct discount amount.', () => {
        const discount = calculateDiscount(100, 10)
        expect(discount).toBe(10)
    })

    it('should return status code of 200', async () => {
        const res = await request(app).get('/').send()
        expect(res.statusCode).toBe(200)
    })
})

import { gaodeMapService } from './gaodeMap'
import type { SearchResultItem } from '../types'

const AMAP_KEY = 'ab5e502fd56c175dd12c0243301e6437'

interface AmapPlaceResponse {
  status: string
  info: string
  count?: string
  pois?: Array<{
    id?: string
    name?: string
    type?: string
    address?: string
    location?: string
    pcode?: string
    pname?: string
    citycode?: string
    cityname?: string
    adcode?: string
    adname?: string
  }>
}

class SearchService {
  private cache = new Map<string, SearchResultItem[]>()

  async searchPlaces(keyword: string): Promise<SearchResultItem[]> {
    const normalizedKeyword = keyword.trim()
    if (!normalizedKeyword) {
      return []
    }

    const cacheKey = normalizedKeyword.toLowerCase()
    const cached = this.cache.get(cacheKey)
    if (cached) {
      return cached
    }

    let restError: Error | null = null
    let jsApiError: Error | null = null

    try {
      const restResults = await this.searchByRest(normalizedKeyword, cacheKey)
      if (restResults.length > 0) {
        this.cache.set(cacheKey, restResults)
        return restResults
      }
    } catch (error) {
      restError = error instanceof Error ? error : new Error(String(error))
      console.warn(`REST API 搜索失败: ${restError.message}`)
    }

    try {
      const jsApiResults = await this.searchByJsApi(normalizedKeyword, cacheKey)
      this.cache.set(cacheKey, jsApiResults)
      return jsApiResults
    } catch (error) {
      jsApiError = error instanceof Error ? error : new Error(String(error))
      console.warn(`JS API 搜索失败: ${jsApiError.message}`)
    }

    throw new Error(`JSAPI 地点检索失败: status=error\nREST API 错误: ${restError?.message || '无'}\nJS API 错误: ${jsApiError?.message || '无'}`)
  }

  private async searchByRest(keyword: string, cacheKey: string): Promise<SearchResultItem[]> {
    const url = new URL('https://restapi.amap.com/v3/place/text')
    url.searchParams.set('keywords', keyword)
    url.searchParams.set('city', '全国')
    url.searchParams.set('output', 'json')
    url.searchParams.set('offset', '10')
    url.searchParams.set('page', '1')
    url.searchParams.set('extensions', 'base')
    url.searchParams.set('key', AMAP_KEY)

    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`地点检索请求失败：HTTP ${response.status}`)
    }

    const data = (await response.json()) as AmapPlaceResponse
    if (data.status !== '1') {
      throw new Error(data.info || `高德地点检索失败：status=${data.status}`)
    }

    return this.normalizeResults(data.pois ?? [], cacheKey)
  }

  private async searchByJsApi(keyword: string, cacheKey: string): Promise<SearchResultItem[]> {
    await gaodeMapService.load()

    return new Promise((resolve, reject) => {
      AMap.plugin('AMap.PlaceSearch', () => {
        const placeSearch = new AMap.PlaceSearch({
          pageSize: 10,
          pageIndex: 1,
          extensions: 'base',
        })

        placeSearch.search(keyword, (status, result) => {
          if (status !== 'complete' || typeof result === 'string') {
            reject(new Error(`JSAPI 地点检索失败：status=${status}`))
            return
          }

          if (!result.poiList || !result.poiList.pois) {
            resolve([])
            return
          }

          const items: SearchResultItem[] = result.poiList.pois.map((poi, index) => ({
            id: poi.id || `${cacheKey}-${index}`,
            name: poi.name || '未命名地点',
            address: poi.address || '暂无地址',
            lng: poi.location.getLng(),
            lat: poi.location.getLat(),
            city: poi.cityname,
            province: poi.pname,
          }))

          resolve(items)
        })
      })
    })
  }

  private normalizeResults(
    results: NonNullable<AmapPlaceResponse['pois']>,
    cacheKey: string,
  ): SearchResultItem[]  {
    return results
      .filter((item) => item.name && item.location)
      .map((item, index) => {
        const [lng, lat] = (item.location || '0,0').split(',').map(Number)
        return {
          id: item.id || `${cacheKey}-${index}`,
          name: item.name || '未命名地点',
          address: item.address || '暂无地址',
          lng,
          lat,
          city: item.cityname,
          province: item.pname,
        }
      })
  }
}

export const searchService = new SearchService()

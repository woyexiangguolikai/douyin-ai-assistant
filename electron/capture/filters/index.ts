 import { Danmaku, FilterRule } from '../../types'
 
 /** 弹幕过滤结果 */
 export interface FilterResult {
   passed: boolean
   reason?: string
   matchedRule?: string
 }
 
 /** 过滤链 — 依次应用所有启用的规则 */
 export class DanmakuFilter {
   private rules: FilterRule[] = []
   private recentCache: Map<string, { count: number; lastTime: number }> = new Map()
   private cacheWindowMs = 5000  // 5 秒内视为"短时间"
 
   updateRules(rules: FilterRule[]) {
     this.rules = rules.filter(r => r.enabled)
   }
 
   filter(danmaku: Danmaku): FilterResult {
     const content = danmaku.content.trim()
 
     for (const rule of this.rules) {
       const result = this.applyRule(rule, content)
       if (!result.passed) {
         return result
       }
     }
 
     return { passed: true }
   }
 
   private applyRule(rule: FilterRule, content: string): FilterResult {
     switch (rule.type) {
       case 'length': {
         if (rule.minLength && content.length < rule.minLength) {
           return { passed: false, reason: `字数不足 ${rule.minLength} 字`, matchedRule: rule.id }
         }
         if (rule.maxLength && content.length > rule.maxLength) {
           return { passed: false, reason: `字数超过 ${rule.maxLength} 字`, matchedRule: rule.id }
         }
         return { passed: true }
       }
 
       case 'emoji_only': {
         const emojiRegex = /^[\p{Emoji}\p{So}\s]+$/u
         if (emojiRegex.test(content)) {
           return { passed: false, reason: '纯表情弹幕', matchedRule: rule.id }
         }
         return { passed: true }
       }
 
       case 'repeat': {
         const key = content.toLowerCase()
         const now = Date.now()
         const cached = this.recentCache.get(key)
         
         if (cached && (now - cached.lastTime) < this.cacheWindowMs) {
           cached.count++
           cached.lastTime = now
           if (cached.count > (rule.maxRepeat || 3)) {
             return { passed: false, reason: '重复刷屏', matchedRule: rule.id }
           }
         } else {
           this.recentCache.set(key, { count: 1, lastTime: now })
         }
         
         // 清理过期缓存
         this.cleanCache()
         return { passed: true }
       }
 
       case 'ad':
       case 'regex': {
         if (rule.pattern) {
           try {
             const regex = new RegExp(rule.pattern, 'i')
             if (regex.test(content)) {
               return { passed: false, reason: `匹配规则: ${rule.name}`, matchedRule: rule.id }
             }
           } catch {
             // 正则无效，跳过该规则
           }
         }
         return { passed: true }
       }
 
       case 'custom': {
         // 自定义规则通过 AI 处理，不在此处拦截
         return { passed: true }
       }
 
       default:
         return { passed: true }
     }
   }
 
   private cleanCache() {
     const now = Date.now()
     for (const [key, val] of this.recentCache.entries()) {
       if (now - val.lastTime > this.cacheWindowMs * 2) {
         this.recentCache.delete(key)
       }
     }
   }
 
   /** 重置重复检测缓存（房间切换时调用） */
   reset() {
     this.recentCache.clear()
   }
 }

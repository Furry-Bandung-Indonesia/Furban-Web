<template>
  <div class="flex-1 flex flex-col h-full overflow-hidden">
    <!-- Header -->
    <header class="shrink-0 bg-[#101622] z-10 px-6 pt-6 pb-3">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold tracking-tight text-white">Event Configuration</h2>
          <p class="text-slate-400 text-sm mt-1">Manage event details, tiers, and food options.</p>
        </div>
        <div class="flex items-center gap-3">
          <router-link :to="`/event/id/${eventId}`" target="_blank" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm hover:border-[#0df2f2] hover:text-white transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            Preview
          </router-link>
          <select v-model="eventStatus" @change="handleStatusChange" class="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium ring-1 ring-inset ring-slate-700 border-0 focus:ring-[#0df2f2]" :class="statusColor">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>
    </header>

    <!-- Scrollable Content -->
    <div class="flex-1 overflow-y-auto px-6 py-4 space-y-6 pb-24">
      <!-- Loading -->
      <div v-if="isLoading" class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#0df2f2]"></div>
      </div>

      <template v-else>
        <!-- ═══ Basic Information ═══ -->
        <section class="bg-[#161e2c] rounded-xl border border-slate-800 overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-800">
            <h3 class="text-lg font-bold text-white">Basic Information</h3>
          </div>
          <div class="p-6 space-y-5">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Event Name *</label>
              <input v-model="form.event_name" class="w-full h-11 px-4 rounded-lg border-0 bg-slate-900 text-white ring-1 ring-slate-700 focus:ring-2 focus:ring-[#0df2f2] text-sm" placeholder="Enter event name" />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Description</label>
              <TipTapEditor v-model="form.description" :event-id="eventId" placeholder="Describe your event... (supports rich text, images, and Mermaid diagrams)" />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Terms of Service</label>
              <div class="flex items-center gap-2 mb-2">
                <button type="button" @click="loadDefaultTos" class="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-700 text-[#0df2f2] hover:bg-slate-600 transition-colors">
                  Load Default Template
                </button>
                <span v-if="form.tos_text" class="text-xs text-slate-500">This will replace existing content</span>
              </div>
              <TipTapEditor v-model="form.tos_text" :event-id="eventId" placeholder="Write your terms of service..." />
            </div>

            <!-- Banner Image -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Banner Image</label>
              <div v-if="bannerPreview || currentBanner" class="relative mb-3">
                <img :src="bannerPreview || getImageUrl(currentBanner)" alt="Banner" class="w-full max-h-48 object-cover rounded-lg border border-slate-700" />
                <button @click="removeBanner" class="absolute top-2 right-2 p-1.5 rounded-full bg-red-600/80 text-white hover:bg-red-600">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <label
                class="flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed cursor-pointer transition-all duration-200 bg-slate-900/50"
                :class="isDraggingBanner ? 'border-[#0df2f2] bg-[#0df2f2]/5 scale-[1.01]' : 'border-slate-700 hover:border-[#0df2f2]/50'"
                @dragover.prevent="isDraggingBanner = true"
                @dragenter.prevent="isDraggingBanner = true"
                @dragleave.prevent="isDraggingBanner = false"
                @drop.prevent="handleBannerDrop"
              >
                <div class="text-center pointer-events-none">
                  <svg class="mx-auto w-8 h-8 mb-2 transition-colors" :class="isDraggingBanner ? 'text-[#0df2f2]' : 'text-slate-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span class="text-sm" :class="isDraggingBanner ? 'text-[#0df2f2]' : 'text-slate-400'">{{ isDraggingBanner ? 'Drop image here' : 'Click or drag & drop banner' }}</span>
                  <span class="block text-xs text-slate-500 mt-1">PNG, JPG or WebP (max 8MB)</span>
                </div>
                <input type="file" accept="image/*" class="hidden" @change="handleBannerUpload" />
              </label>
            </div>

            <!-- Location & Dates -->
            <div class="space-y-5">
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">Location</label>
                <input v-model="form.location_name" class="w-full h-11 px-4 rounded-lg border-0 bg-slate-900 text-white ring-1 ring-slate-700 focus:ring-2 focus:ring-[#0df2f2] text-sm" placeholder="Venue name or address" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">Pin Location</label>
                <MapPicker
                  v-model:lat="form.location_lat"
                  v-model:lng="form.location_long"
                  @update:location-name="name => { if (!form.location_name) form.location_name = name }"
                  map-height="250px"
                  placeholder="Search venue or click map..."
                />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">Start Time *</label>
                <input v-model="form.start_time" type="datetime-local" class="w-full h-11 px-4 rounded-lg border-0 bg-slate-900 text-white ring-1 ring-slate-700 focus:ring-2 focus:ring-[#0df2f2] text-sm" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">End Time *</label>
                <input v-model="form.end_time" type="datetime-local" class="w-full h-11 px-4 rounded-lg border-0 bg-slate-900 text-white ring-1 ring-slate-700 focus:ring-2 focus:ring-[#0df2f2] text-sm" />
              </div>
            </div>
          </div>
        </section>

        <!-- ═══ Ticket Tiers ═══ -->
        <section class="bg-[#161e2c] rounded-xl border border-slate-800 overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h3 class="text-lg font-bold text-white">Ticket Tiers</h3>
            <button @click="openTierModal()" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0df2f2] text-[#0a0e17] text-sm font-semibold hover:bg-[#00dada] transition-colors">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
              Add Tier
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                  <th class="px-6 py-3 text-left font-semibold">Tier Name</th>
                  <th class="px-6 py-3 text-left font-semibold">Price</th>
                  <th class="px-6 py-3 text-left font-semibold">Admin Fee</th>
                  <th class="px-6 py-3 text-left font-semibold">Quota</th>
                  <th class="px-6 py-3 text-left font-semibold">Sold</th>
                  <th class="px-6 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800">
                <tr v-for="tier in tiers" :key="tier.tier_uuid" class="hover:bg-white/[0.02] transition-colors">
                  <td class="px-6 py-4">
                    <div>
                      <div class="flex items-center gap-2">
                        <p class="text-sm font-medium text-white">{{ tier.tier_name }}</p>
                        <span v-if="tier.name_your_price" class="px-1.5 py-0.5 rounded bg-[#0df2f2]/10 text-[#0df2f2] text-[10px] font-bold uppercase tracking-wider border border-[#0df2f2]/20">NYP</span>
                      </div>
                      <p v-if="tier.tier_description" class="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">{{ tier.tier_description }}</p>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-sm text-white font-mono">
                    {{ formatCurrency(tier.price_total) }}
                    <span v-if="tier.name_your_price" class="text-[10px] text-slate-400 block">+ custom</span>
                  </td>
                  <td class="px-6 py-4 text-sm text-slate-400 font-mono">{{ formatCurrency(tier.admin_fee_internal || 0) }}</td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="flex-1 max-w-[120px]">
                        <div class="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div class="h-full bg-[#0df2f2] rounded-full" :style="{ width: tierSoldPercent(tier) + '%' }"></div>
                        </div>
                      </div>
                      <span class="text-xs text-slate-400">{{ tier.quota_total }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-sm text-white">{{ tier.quota_total - (tier.quota_available || 0) }}</td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <button @click="openTierModal(tier)" class="p-1.5 rounded-lg text-slate-400 hover:text-[#0df2f2] hover:bg-slate-800 transition-colors">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button @click="handleDeleteTier(tier)" class="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="tiers.length === 0">
                  <td colspan="6" class="px-6 py-8 text-center text-sm text-slate-400">No tiers configured. Add your first ticket tier.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- ═══ Food & Beverage ═══ -->
        <section class="bg-[#161e2c] rounded-xl border border-slate-800 overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h3 class="text-lg font-bold text-white">Food Choices</h3>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" v-model="form.food_enabled" class="sr-only peer" />
              <div class="w-11 h-6 bg-slate-700 peer-focus:ring-2 peer-focus:ring-[#0df2f2]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0df2f2]"></div>
              <span class="ml-2 text-sm text-slate-300">{{ form.food_enabled ? 'Enabled' : 'Disabled' }}</span>
            </label>
          </div>
          <div v-if="form.food_enabled" class="p-6 space-y-4">
            <label class="inline-flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="form.food_multi_select" class="rounded border-slate-700 bg-slate-900 text-[#0df2f2] focus:ring-[#0df2f2]" />
              <span class="text-sm text-slate-300">Allow multiple selections</span>
            </label>

            <!-- Food options list -->
            <div class="space-y-4">
              <div v-for="(opt, idx) in foodOptions" :key="idx" class="bg-slate-900 rounded-lg ring-1 ring-slate-700 overflow-hidden">
                <!-- Menu item header -->
                <div class="flex items-center gap-3 px-4 py-3">
                  <button @click="opt._expanded = !opt._expanded" class="text-slate-400 hover:text-white transition-colors shrink-0">
                    <svg class="w-4 h-4 transition-transform" :class="opt._expanded && 'rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                  </button>
                  <input v-model="foodOptions[idx].name" class="flex-1 bg-transparent border-0 text-white text-sm focus:ring-0 p-0" placeholder="Menu item name (e.g. Chicken)" />
                  <div class="flex items-center gap-1 shrink-0">
                    <span class="text-slate-500 text-xs">IDR</span>
                    <input v-model.number="foodOptions[idx].price" type="number" min="0" step="1000"
                      class="w-24 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-sm text-right focus:ring-1 focus:ring-[#0df2f2] focus:border-[#0df2f2]"
                      placeholder="0" />
                  </div>
                  <span v-if="opt.choices?.length" class="text-[10px] text-slate-500 shrink-0">{{ opt.choices.length }} choice{{ opt.choices.length > 1 ? 's' : '' }}</span>
                  <button @click="foodOptions.splice(idx, 1)" class="text-slate-400 hover:text-red-400 shrink-0">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <!-- Choices (sub-options like sauces) -->
                <div v-if="opt._expanded" class="border-t border-slate-800 px-4 py-3 bg-slate-950/50 space-y-2">
                  <p class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Choices / Variants <span class="normal-case font-normal">(e.g. sauce, cooking level)</span></p>
                  <div v-for="(ch, ci) in (opt.choices || [])" :key="ci" class="flex items-center gap-2">
                    <span class="text-slate-600 text-xs">└</span>
                    <input v-model="opt.choices[ci].name" class="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white text-xs focus:ring-1 focus:ring-[#0df2f2] focus:border-[#0df2f2]" placeholder="Choice name (e.g. BBQ Sauce)" />
                    <div class="flex items-center gap-1 shrink-0">
                      <span class="text-slate-600 text-[10px]">+IDR</span>
                      <input v-model.number="opt.choices[ci].price" type="number" min="0" step="1000"
                        class="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white text-xs text-right focus:ring-1 focus:ring-[#0df2f2] focus:border-[#0df2f2]"
                        placeholder="0" />
                    </div>
                    <button @click="opt.choices.splice(ci, 1)" class="text-slate-500 hover:text-red-400">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <button @click="if (!opt.choices) opt.choices = []; opt.choices.push({ name: '', price: 0 })" class="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#0df2f2] transition-colors">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                    Add Choice
                  </button>
                </div>
              </div>
            </div>
            <button @click="foodOptions.push({ name: '', price: 0, choices: [], _expanded: false })" class="inline-flex items-center gap-2 text-sm text-[#0df2f2] hover:text-white transition-colors">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
              Add Menu Item
            </button>
          </div>
        </section>

        <!-- ═══ Drinks Menu ═══ -->
        <section class="bg-[#161e2c] rounded-xl border border-slate-800 overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h3 class="text-lg font-bold text-white">Drinks Choices</h3>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" v-model="form.drinks_enabled" class="sr-only peer" />
              <div class="w-11 h-6 bg-slate-700 peer-focus:ring-2 peer-focus:ring-[#0df2f2]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0df2f2]"></div>
              <span class="ml-2 text-sm text-slate-300">{{ form.drinks_enabled ? 'Enabled' : 'Disabled' }}</span>
            </label>
          </div>
          <div v-if="form.drinks_enabled" class="p-6 space-y-4">
            <label class="inline-flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="form.drinks_multi_select" class="rounded border-slate-700 bg-slate-900 text-[#0df2f2] focus:ring-[#0df2f2]" />
              <span class="text-sm text-slate-300">Allow multiple selections</span>
            </label>

            <!-- Drink options list -->
            <div class="space-y-4">
              <div v-for="(opt, idx) in drinkOptions" :key="idx" class="bg-slate-900 rounded-lg ring-1 ring-slate-700 overflow-hidden">
                <!-- Menu item header -->
                <div class="flex items-center gap-3 px-4 py-3">
                  <button @click="opt._expanded = !opt._expanded" class="text-slate-400 hover:text-white transition-colors shrink-0">
                    <svg class="w-4 h-4 transition-transform" :class="opt._expanded && 'rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                  </button>
                  <input v-model="drinkOptions[idx].name" class="flex-1 bg-transparent border-0 text-white text-sm focus:ring-0 p-0" placeholder="Drink item name (e.g. Cola)" />
                  <div class="flex items-center gap-1 shrink-0">
                    <span class="text-slate-500 text-xs">IDR</span>
                    <input v-model.number="drinkOptions[idx].price" type="number" min="0" step="1000"
                      class="w-24 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-sm text-right focus:ring-1 focus:ring-[#0df2f2] focus:border-[#0df2f2]"
                      placeholder="0" />
                  </div>
                  <span v-if="opt.choices?.length" class="text-[10px] text-slate-500 shrink-0">{{ opt.choices.length }} choice{{ opt.choices.length > 1 ? 's' : '' }}</span>
                  <button @click="drinkOptions.splice(idx, 1)" class="text-slate-400 hover:text-red-400 shrink-0">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <!-- Choices (sub-options) -->
                <div v-if="opt._expanded" class="border-t border-slate-800 px-4 py-3 bg-slate-950/50 space-y-2">
                  <p class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Choices / Variants <span class="normal-case font-normal">(e.g. size, flavor)</span></p>
                  <div v-for="(ch, ci) in (opt.choices || [])" :key="ci" class="flex items-center gap-2">
                    <span class="text-slate-600 text-xs">└</span>
                    <input v-model="opt.choices[ci].name" class="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white text-xs focus:ring-1 focus:ring-[#0df2f2] focus:border-[#0df2f2]" placeholder="Choice name (e.g. Large)" />
                    <div class="flex items-center gap-1 shrink-0">
                      <span class="text-slate-600 text-[10px]">+IDR</span>
                      <input v-model.number="opt.choices[ci].price" type="number" min="0" step="1000"
                        class="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white text-xs text-right focus:ring-1 focus:ring-[#0df2f2] focus:border-[#0df2f2]"
                        placeholder="0" />
                    </div>
                    <button @click="opt.choices.splice(ci, 1)" class="text-slate-500 hover:text-red-400">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <button @click="if (!opt.choices) opt.choices = []; opt.choices.push({ name: '', price: 0 })" class="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#0df2f2] transition-colors">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                    Add Choice
                  </button>
                </div>
              </div>
            </div>
            <button @click="drinkOptions.push({ name: '', price: 0, choices: [], _expanded: false })" class="inline-flex items-center gap-2 text-sm text-[#0df2f2] hover:text-white transition-colors">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
              Add Drink Item
            </button>
          </div>
        </section>

        <!-- ═══ Ticket Sales Status ═══ -->
        <section class="bg-[#161e2c] rounded-xl border border-slate-800 overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h3 class="text-lg font-bold text-white">Ticket Sales</h3>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full"
              :class="{
                'bg-green-500/20 text-green-400': form.sales_status === 'available',
                'bg-red-500/20 text-red-400': form.sales_status === 'sold_out',
                'bg-amber-500/20 text-amber-400': form.sales_status === 'coming_soon',
                'bg-slate-500/20 text-slate-400': form.sales_status === 'unavailable',
              }"
            >
              {{ { available: 'On Sale', sold_out: 'Sold Out', coming_soon: 'Coming Soon', unavailable: 'Unavailable' }[form.sales_status] }}
            </span>
          </div>
          <div class="p-6 space-y-5">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Sales Status</label>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button type="button" @click="form.sales_status = 'available'"
                  class="flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all text-center"
                  :class="form.sales_status === 'available' ? 'border-green-500 bg-green-500/10' : 'border-slate-700 hover:border-slate-500'">
                  <svg class="w-6 h-6" :class="form.sales_status === 'available' ? 'text-green-400' : 'text-slate-500'" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                  <span class="text-xs font-semibold" :class="form.sales_status === 'available' ? 'text-green-400' : 'text-slate-400'">Available</span>
                </button>
                <button type="button" @click="form.sales_status = 'sold_out'"
                  class="flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all text-center"
                  :class="form.sales_status === 'sold_out' ? 'border-red-500 bg-red-500/10' : 'border-slate-700 hover:border-slate-500'">
                  <svg class="w-6 h-6" :class="form.sales_status === 'sold_out' ? 'text-red-400' : 'text-slate-500'" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                  <span class="text-xs font-semibold" :class="form.sales_status === 'sold_out' ? 'text-red-400' : 'text-slate-400'">Sold Out</span>
                </button>
                <button type="button" @click="form.sales_status = 'coming_soon'"
                  class="flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all text-center"
                  :class="form.sales_status === 'coming_soon' ? 'border-amber-500 bg-amber-500/10' : 'border-slate-700 hover:border-slate-500'">
                  <svg class="w-6 h-6" :class="form.sales_status === 'coming_soon' ? 'text-amber-400' : 'text-slate-500'" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span class="text-xs font-semibold" :class="form.sales_status === 'coming_soon' ? 'text-amber-400' : 'text-slate-400'">Coming Soon</span>
                </button>
                <button type="button" @click="form.sales_status = 'unavailable'"
                  class="flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all text-center"
                  :class="form.sales_status === 'unavailable' ? 'border-slate-500 bg-slate-500/10' : 'border-slate-700 hover:border-slate-500'">
                  <svg class="w-6 h-6" :class="form.sales_status === 'unavailable' ? 'text-slate-300' : 'text-slate-500'" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  <span class="text-xs font-semibold" :class="form.sales_status === 'unavailable' ? 'text-slate-300' : 'text-slate-400'">Unavailable</span>
                </button>
              </div>
            </div>

            <!-- Coming Soon: Open Time -->
            <div v-if="form.sales_status === 'coming_soon'" class="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 space-y-3">
              <div class="flex items-center gap-2 text-amber-400 text-sm font-semibold">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Sales will open automatically at this time
              </div>
              <div>
                <label class="block text-xs text-slate-400 mb-1">Open Time *</label>
                <input type="datetime-local" v-model="form.sales_open_time" required
                  class="w-full h-10 px-3 rounded-lg bg-slate-900 text-white border border-slate-700 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-sm [color-scheme:dark]" />
              </div>
            </div>

            <!-- Unavailable: Close Time -->
            <div v-if="form.sales_status === 'unavailable'" class="bg-slate-500/5 border border-slate-600/30 rounded-lg p-4 space-y-3">
              <div class="flex items-center gap-2 text-slate-300 text-sm font-semibold">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Sales will close automatically at this time
              </div>
              <div>
                <label class="block text-xs text-slate-400 mb-1">Close Time (optional)</label>
                <input type="datetime-local" v-model="form.sales_close_time"
                  class="w-full h-10 px-3 rounded-lg bg-slate-900 text-white border border-slate-700 focus:ring-1 focus:ring-slate-500 focus:border-slate-500 text-sm [color-scheme:dark]" />
                <p class="text-[10px] text-slate-500 mt-1">Leave empty to keep sales closed indefinitely until you change status manually.</p>
              </div>
            </div>

            <!-- Auto close time for Available status -->
            <div v-if="form.sales_status === 'available'" class="bg-slate-800/30 rounded-lg p-4 space-y-3">
              <div class="flex items-center gap-2 text-slate-300 text-sm font-medium">
                <svg class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Auto-close sales at (optional)
              </div>
              <input type="datetime-local" v-model="form.sales_close_time"
                class="w-full h-10 px-3 rounded-lg bg-slate-900 text-white border border-slate-700 focus:ring-1 focus:ring-slate-500 focus:border-slate-500 text-sm [color-scheme:dark]" />
              <p class="text-[10px] text-slate-500">Tickets will automatically stop selling after this time. Leave empty for no auto-close.</p>
            </div>

            <p class="text-[11px] text-slate-500">
              <strong class="text-slate-400">Note:</strong>
              Sold Out &amp; Unavailable prevent all ticket purchases. Coming Soon blocks sales until the open time.
              The API enforces these rules — no bypass is possible.
            </p>
          </div>
        </section>

        <!-- ═══ Danger Zone ═══ -->
        <section class="bg-[#161e2c] rounded-xl border border-red-900/50 overflow-hidden">
          <div class="px-6 py-4 border-b border-red-900/30">
            <h3 class="text-lg font-bold text-red-400">Danger Zone</h3>
          </div>
          <div class="p-6 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-white">Delete this event</p>
              <p class="text-xs text-slate-400 mt-1">All tickets, tiers, and data will be permanently removed.</p>
            </div>
            <button @click="confirmDelete" class="px-4 py-2 rounded-lg border border-red-700 text-red-400 text-sm font-medium hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors">
              Delete Event
            </button>
          </div>
        </section>
      </template>
    </div>

    <!-- Floating Save Bar -->
    <div v-if="hasChanges" class="sticky bottom-0 left-0 right-0 bg-[#1a202c]/95 backdrop-blur-sm border-t border-slate-700 px-6 py-3 flex items-center justify-between z-20">
      <div class="flex items-center gap-2">
        <span class="size-2 rounded-full bg-yellow-400 animate-pulse"></span>
        <span class="text-sm text-slate-300">Unsaved changes</span>
      </div>
      <div class="flex items-center gap-3">
        <button @click="resetForm" class="px-4 py-2 rounded-lg border border-slate-700 text-white text-sm hover:bg-slate-800">Discard</button>
        <button @click="saveEvent" :disabled="isSaving" class="px-6 py-2 rounded-lg bg-[#0df2f2] text-[#0a0e17] font-bold text-sm hover:bg-[#00dada] disabled:opacity-50">
          {{ isSaving ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>
    </div>

    <!-- Tier Modal -->
    <div v-if="showTierModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" @click.self="showTierModal = false">
      <div class="w-full max-w-md bg-[#1e2430] rounded-xl border border-slate-700 shadow-2xl">
        <div class="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
          <h3 class="text-lg font-bold text-white">{{ editingTier ? 'Edit Tier' : 'Add Tier' }}</h3>
          <button @click="showTierModal = false" class="text-slate-400 hover:text-white">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form @submit.prevent="saveTier" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Tier Name *</label>
            <input v-model="tierForm.tier_name" required class="w-full h-11 px-4 rounded-lg border-0 bg-slate-900 text-white ring-1 ring-slate-700 focus:ring-2 focus:ring-[#0df2f2] text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea v-model="tierForm.tier_description" rows="2" class="w-full px-4 py-3 rounded-lg border-0 bg-slate-900 text-white ring-1 ring-slate-700 focus:ring-2 focus:ring-[#0df2f2] resize-none text-sm"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Ticket Price (Base) *</label>
              <input v-model.number="tierForm.base_price" type="number" min="0" step="1000" required class="w-full h-11 px-4 rounded-lg border-0 bg-slate-900 text-white ring-1 ring-slate-700 focus:ring-2 focus:ring-[#0df2f2] text-sm" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Admin Fee</label>
              <input v-model.number="tierForm.admin_fee_internal" type="number" min="0" step="500" class="w-full h-11 px-4 rounded-lg border-0 bg-slate-900 text-white ring-1 ring-slate-700 focus:ring-2 focus:ring-[#0df2f2] text-sm" />
            </div>
          </div>
          <!-- Calculated total -->
          <div class="bg-slate-800/50 rounded-lg px-4 py-3 flex items-center justify-between border border-slate-700/50">
            <span class="text-xs font-medium text-slate-400 uppercase tracking-wider">User Pays</span>
            <span class="text-lg font-bold text-[#0df2f2] tabular-nums">IDR {{ ((tierForm.base_price || 0) + (tierForm.admin_fee_internal || 0)).toLocaleString('id-ID') }}</span>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Quota *</label>
              <input v-model.number="tierForm.quota_total" type="number" min="1" required class="w-full h-11 px-4 rounded-lg border-0 bg-slate-900 text-white ring-1 ring-slate-700 focus:ring-2 focus:ring-[#0df2f2] text-sm" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Sort Order</label>
              <input v-model.number="tierForm.sort_order" type="number" min="0" class="w-full h-11 px-4 rounded-lg border-0 bg-slate-900 text-white ring-1 ring-slate-700 focus:ring-2 focus:ring-[#0df2f2] text-sm" />
            </div>
          </div>
          <!-- Name Your Price Toggle -->
          <div class="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/50 p-4">
            <div class="flex flex-col gap-1">
              <span class="text-sm font-medium text-white">Name Your Price</span>
              <span class="text-xs text-slate-400">Allow attendees to set their own price (minimum = base price)</span>
            </div>
            <label class="flex items-center cursor-pointer relative">
              <input type="checkbox" v-model="tierForm.name_your_price" class="sr-only peer" />
              <div class="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#0df2f2]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0df2f2]"></div>
            </label>
          </div>
          <div v-if="tierError" class="text-red-400 text-sm">{{ tierError }}</div>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="showTierModal = false" class="px-4 py-2 rounded-lg border border-slate-700 text-white text-sm hover:bg-slate-800">Cancel</button>
            <button type="submit" :disabled="isSavingTier" class="px-6 py-2 rounded-lg bg-[#0df2f2] text-[#0a0e17] font-bold text-sm hover:bg-[#00dada] disabled:opacity-50">
              {{ isSavingTier ? 'Saving...' : (editingTier ? 'Update' : 'Create') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirm -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" @click.self="showDeleteConfirm = false">
      <div class="w-full max-w-sm bg-[#1e2430] rounded-xl border border-slate-700 shadow-2xl p-6 text-center">
        <div class="size-12 rounded-full bg-red-600/20 flex items-center justify-center mx-auto mb-4">
          <svg class="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
        </div>
        <h3 class="text-lg font-bold text-white mb-2">Delete Event?</h3>
        <p class="text-sm text-slate-400 mb-6">This will permanently delete the event and all associated data. This action cannot be undone.</p>
        <div class="flex gap-3">
          <button @click="showDeleteConfirm = false" class="flex-1 px-4 py-2 rounded-lg border border-slate-700 text-white text-sm hover:bg-slate-800">Cancel</button>
          <button @click="deleteEvent" :disabled="isDeleting" class="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50">
            {{ isDeleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ticketApi from '../../../services/ticketApi'
import TipTapEditor from '../../../components/TipTapEditor.vue'
import MapPicker from '../../../components/MapPicker.vue'
import { defaultEventTos } from '../../../config/defaultEventTos'

const props = defineProps({ event: Object })
const emit = defineEmits(['update-event'])

const route = useRoute()
const router = useRouter()
const eventId = computed(() => route.params.eventId)

const isLoading = ref(true)
const isSaving = ref(false)
const eventStatus = ref('draft')
const currentBanner = ref(null)
const bannerFile = ref(null)
const bannerPreview = ref(null)
const isDraggingBanner = ref(false)

// Form state
const form = reactive({
  event_name: '',
  description: '',
  tos_text: '',
  location_name: '',
  location_lat: null,
  location_long: null,
  start_time: '',
  end_time: '',
  food_enabled: false,
  food_multi_select: false,
  drinks_enabled: false,
  drinks_multi_select: false,
  sales_status: 'available',
  sales_open_time: '',
  sales_close_time: '',
})

const foodOptions = ref([])
const drinkOptions = ref([])

// Snapshot for change detection
const formSnapshot = ref('')

const hasChanges = computed(() => {
  const current = JSON.stringify({ ...form, food_options: foodOptions.value, drink_options: drinkOptions.value, banner_changed: !!bannerFile.value })
  return current !== formSnapshot.value
})

const statusColor = computed(() => {
  const map = {
    published: 'text-green-400',
    draft: 'text-yellow-400',
    closed: 'text-slate-400',
  }
  return map[eventStatus.value] || 'text-white'
})

// ═══ Tiers ═══
const tiers = ref([])
const showTierModal = ref(false)
const editingTier = ref(null)
const isSavingTier = ref(false)
const tierError = ref('')
const tierForm = reactive({
  tier_name: '',
  tier_description: '',
  base_price: 0,
  admin_fee_internal: 0,
  quota_total: 1,
  sort_order: 0,
  name_your_price: false,
})

// ═══ Delete ═══
const showDeleteConfirm = ref(false)
const isDeleting = ref(false)

function getImageUrl(banner) {
  return ticketApi.getEventImageUrl(banner)
}

function formatCurrency(val) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0)
}

function tierSoldPercent(tier) {
  if (!tier.quota_total) return 0
  const sold = tier.quota_total - (tier.quota_available ?? tier.quota_total)
  return Math.min(100, Math.round((sold / tier.quota_total) * 100))
}

function toLocalDatetime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

function populateForm(ev) {
  form.event_name = ev.event_name || ''
  form.description = ev.description || ''
  form.tos_text = ev.tos_text || ''
  form.location_name = ev.location_name || ''
  form.location_lat = ev.location_lat || null
  form.location_long = ev.location_long || null
  form.start_time = toLocalDatetime(ev.start_time)
  form.end_time = toLocalDatetime(ev.end_time)
  form.food_enabled = !!ev.food_enabled
  form.food_multi_select = !!ev.food_multi_select
  form.drinks_enabled = !!ev.drinks_enabled
  form.drinks_multi_select = !!ev.drinks_multi_select
  form.sales_status = ev.sales_status || 'available'
  form.sales_open_time = ev.sales_open_time ? toLocalDatetime(ev.sales_open_time) : ''
  form.sales_close_time = ev.sales_close_time ? toLocalDatetime(ev.sales_close_time) : ''
  eventStatus.value = ev.status || 'draft'
  currentBanner.value = ev.banner_filename || null

  // Parse food_options — support legacy string[], {name,price}[], and new {name,price,choices}[] format
  try {
    const opts = typeof ev.food_options === 'string' ? JSON.parse(ev.food_options) : ev.food_options
    if (Array.isArray(opts)) {
      foodOptions.value = opts.map(item => {
        if (typeof item === 'string') return { name: item, price: 0, choices: [], _expanded: false }
        return {
          name: item.name || '',
          price: Number(item.price) || 0,
          choices: Array.isArray(item.choices) ? item.choices.map(c => ({ name: c.name || '', price: Number(c.price) || 0 })) : [],
          _expanded: false,
        }
      })
    } else {
      foodOptions.value = []
    }
  } catch {
    foodOptions.value = []
  }

  // Parse drink_options
  try {
    const opts = typeof ev.drink_options === 'string' ? JSON.parse(ev.drink_options) : ev.drink_options
    if (Array.isArray(opts)) {
      drinkOptions.value = opts.map(item => {
        if (typeof item === 'string') return { name: item, price: 0, choices: [], _expanded: false }
        return {
          name: item.name || '',
          price: Number(item.price) || 0,
          choices: Array.isArray(item.choices) ? item.choices.map(c => ({ name: c.name || '', price: Number(c.price) || 0 })) : [],
          _expanded: false,
        }
      })
    } else {
      drinkOptions.value = []
    }
  } catch {
    drinkOptions.value = []
  }

  bannerFile.value = null
  bannerPreview.value = null
  takeSnapshot()
}

function takeSnapshot() {
  formSnapshot.value = JSON.stringify({ ...form, food_options: foodOptions.value, drink_options: drinkOptions.value, banner_changed: false })
}

function resetForm() {
  if (props.event) populateForm(props.event)
}

function handleBannerUpload(e) {
  const file = e.target.files[0]
  if (!file) return
  bannerFile.value = file
  bannerPreview.value = URL.createObjectURL(file)
}

function removeBanner() {
  bannerFile.value = null
  bannerPreview.value = null
  currentBanner.value = null
}

function handleBannerDrop(e) {
  isDraggingBanner.value = false
  const file = e.dataTransfer?.files?.[0]
  if (!file || !file.type.startsWith('image/')) return
  if (file.size > 8 * 1024 * 1024) return
  bannerFile.value = file
  bannerPreview.value = URL.createObjectURL(file)
}

function loadDefaultTos() {
  if (form.tos_text && !confirm('This will replace the current Terms of Service content. Continue?')) return
  form.tos_text = defaultEventTos
}

async function saveEvent() {
  isSaving.value = true
  try {
    const fd = new FormData()
    fd.append('event_name', form.event_name)
    if (form.description) fd.append('description', form.description)
    if (form.tos_text) fd.append('tos_text', form.tos_text)
    if (form.location_name) fd.append('location_name', form.location_name)
    if (form.location_lat != null) fd.append('location_lat', String(form.location_lat))
    if (form.location_long != null) fd.append('location_long', String(form.location_long))
    fd.append('start_time', new Date(form.start_time).toISOString())
    fd.append('end_time', new Date(form.end_time).toISOString())
    fd.append('food_enabled', form.food_enabled ? '1' : '0')
    fd.append('food_multi_select', form.food_multi_select ? '1' : '0')
    fd.append('drinks_enabled', form.drinks_enabled ? '1' : '0')
    fd.append('drinks_multi_select', form.drinks_multi_select ? '1' : '0')
    fd.append('sales_status', form.sales_status)
    if (form.sales_open_time) fd.append('sales_open_time', new Date(form.sales_open_time).toISOString())
    else fd.append('sales_open_time', '')
    if (form.sales_close_time) fd.append('sales_close_time', new Date(form.sales_close_time).toISOString())
    else fd.append('sales_close_time', '')
    if (foodOptions.value.length) fd.append('food_options', JSON.stringify(foodOptions.value.filter(o => o.name).map(o => ({
      name: o.name,
      price: o.price || 0,
      choices: (o.choices || []).filter(c => c.name).map(c => ({ name: c.name, price: c.price || 0 })),
    }))))
    if (drinkOptions.value.length) fd.append('drink_options', JSON.stringify(drinkOptions.value.filter(o => o.name).map(o => ({
      name: o.name,
      price: o.price || 0,
      choices: (o.choices || []).filter(c => c.name).map(c => ({ name: c.name, price: c.price || 0 })),
    }))))
    if (bannerFile.value) fd.append('banner', bannerFile.value)

    await ticketApi.updateEvent(eventId.value, fd)
    emit('update-event')
    takeSnapshot()
    bannerFile.value = null
  } catch (e) {
    alert(e.message || 'Failed to save event')
  } finally {
    isSaving.value = false
  }
}

async function handleStatusChange() {
  try {
    await ticketApi.updateEventStatus(eventId.value, eventStatus.value)
    emit('update-event')
  } catch (e) {
    alert(e.message || 'Failed to update status')
    // Revert
    if (props.event) eventStatus.value = props.event.status || 'draft'
  }
}

// ═══ Tier CRUD ═══
function openTierModal(tier = null) {
  editingTier.value = tier
  tierError.value = ''
  if (tier) {
    Object.assign(tierForm, {
      tier_name: tier.tier_name,
      tier_description: tier.tier_description || '',
      base_price: (tier.price_total || 0) - (tier.admin_fee_internal || 0),
      admin_fee_internal: tier.admin_fee_internal || 0,
      quota_total: tier.quota_total,
      sort_order: tier.sort_order || 0,
      name_your_price: !!tier.name_your_price,
    })
  } else {
    Object.assign(tierForm, { tier_name: '', tier_description: '', base_price: 0, admin_fee_internal: 0, quota_total: 1, sort_order: tiers.value.length, name_your_price: false })
  }
  showTierModal.value = true
}

async function saveTier() {
  isSavingTier.value = true
  tierError.value = ''
  try {
    const payload = {
      tier_name: tierForm.tier_name,
      tier_description: tierForm.tier_description,
      price_total: (tierForm.base_price || 0) + (tierForm.admin_fee_internal || 0),
      admin_fee_internal: tierForm.admin_fee_internal || 0,
      quota_total: tierForm.quota_total,
      sort_order: tierForm.sort_order,
      name_your_price: tierForm.name_your_price,
    }
    if (editingTier.value) {
      await ticketApi.updateTier(eventId.value, editingTier.value.tier_uuid, payload)
    } else {
      await ticketApi.createTier(eventId.value, payload)
    }
    showTierModal.value = false
    await loadTiers()
  } catch (e) {
    tierError.value = e.message || 'Failed to save tier'
  } finally {
    isSavingTier.value = false
  }
}

async function handleDeleteTier(tier) {
  if (!confirm(`Delete tier "${tier.tier_name}"? This cannot be undone.`)) return
  try {
    await ticketApi.deleteTier(eventId.value, tier.tier_uuid)
    await loadTiers()
  } catch (e) {
    alert(e.message || 'Failed to delete tier')
  }
}

async function loadTiers() {
  try {
    const res = await ticketApi.getTiers(eventId.value)
    tiers.value = res.tiers || res || []
  } catch (e) {
    console.error('Failed to load tiers:', e)
  }
}

// ═══ Delete Event ═══
function confirmDelete() {
  showDeleteConfirm.value = true
}

async function deleteEvent() {
  isDeleting.value = true
  try {
    await ticketApi.deleteEvent(eventId.value)
    router.push('/event/manage')
  } catch (e) {
    alert(e.message || 'Failed to delete event')
  } finally {
    isDeleting.value = false
  }
}

// ═══ Init ═══
async function init() {
  isLoading.value = true
  try {
    if (props.event) {
      populateForm(props.event)
    }
    await loadTiers()
  } finally {
    isLoading.value = false
  }
}

watch(() => props.event, (ev) => {
  if (ev) populateForm(ev)
}, { immediate: true })

onMounted(init)
</script>

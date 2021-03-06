/*-
 * <<
 * DBus
 * ==
 * Copyright (C) 2016 - 2017 Bridata
 * ==
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * >>
 */

package com.creditease.dbus.stream.common.appender.spout.processor;

import com.creditease.dbus.commons.ControlMessage;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.common.TopicPartition;

import java.util.List;

/**
 * Created by Shrimp on 16/6/21.
 */
public interface ConsumerListener {
    void resumeTopic(String topic, ControlMessage message);

    void pauseAppender();

    void resumeAppender();

    boolean filterPausedTopic(String topic);

    void pauseTopic(TopicPartition tp, long offset, ControlMessage message);

    void syncOffset(ConsumerRecord<String, byte[]> record);

    List<String> getControlTopics();

    List<String> getDataTopics();

    List<String> getSchemaTopics();

    void seek(ConsumerRecord<String, byte[]> record);
}

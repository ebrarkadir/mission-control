package com.missioncontrol.auth.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.missioncontrol.auth.entity.User;
import com.missioncontrol.auth.entity.UserRole;
import com.missioncontrol.auth.exception.UserNotFoundException;
import com.missioncontrol.auth.repository.UserRepository;

@Service
public class AdminUserService {

    private final UserRepository userRepository;

    public AdminUserService(
            UserRepository userRepository) {

        this.userRepository = userRepository;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User changeRole(
            Long userId,
            UserRole role) {

        User user = getUser(userId);

        user.changeRole(role);

        return userRepository.save(user);
    }

    public User changeEnabled(
            Long userId,
            boolean enabled) {

        User user = getUser(userId);

        user.changeEnabled(enabled);

        return userRepository.save(user);
    }

    private User getUser(Long userId) {

        return userRepository
                .findById(userId)
                .orElseThrow(() ->
                        new UserNotFoundException(userId)
                );
    }
}